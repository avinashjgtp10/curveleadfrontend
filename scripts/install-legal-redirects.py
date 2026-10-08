#!/usr/bin/env python3
"""Install only CurveLead's exact legal redirects; validate and roll back on failure."""
import pathlib
import re
import subprocess

REDIRECTS = {'/privacy': '/privacy-policy', '/terms': '/terms-of-service'}
# Tokenize nginx without interpreting braces or comments inside quoted strings.
TOKENS = re.compile(r'''\#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[{};]|[^\s{};#"']+''')


def update_config(source):
    tokens = [m for m in TOKENS.finditer(source) if not m.group().startswith('#')]
    additions = []
    matches = 0
    for i, token in enumerate(tokens[:-1]):
        if token.group() != 'server' or tokens[i + 1].group() != '{':
            continue
        depth, direct, end = 1, [], None
        for item in tokens[i + 2:]:
            value = item.group()
            if value == '}':
                depth -= 1
                if depth == 0:
                    end = item.start()
                    break
            if depth == 1:
                direct.append(value.strip('\"\''))
            if value == '{':
                depth += 1
        if end is None:
            raise RuntimeError('Unbalanced server block')
        names = []
        for j, value in enumerate(direct):
            if value == 'server_name':
                for name in direct[j + 1:]:
                    if name == ';':
                        break
                    names.append(name)
        if 'curvelead.com' not in names and 'www.curvelead.com' not in names:
            continue
        matches += 1
        block = source[tokens[i + 1].end():end]
        rules = []
        for old, new in REDIRECTS.items():
            destination = 'https://curvelead.com' + new
            rule = 'location = ' + old + ' { return 301 ' + destination + '; }'
            existing = re.search(r'location\s*=\s*' + re.escape(old) + r'\s*\{([^{}]*)\}', block)
            if existing:
                if re.fullmatch(r'\s*return\s+301\s+' + re.escape(new) + r'\s*;\s*', existing[1]):
                    offset = tokens[i + 1].end()
                    additions.append((offset + existing.start(), offset + existing.end(), rule))
                elif not re.fullmatch(r'\s*return\s+301\s+' + re.escape(destination) + r'\s*;\s*', existing[1]):
                    raise RuntimeError('Conflicting existing redirect for ' + old)
            else:
                rules.append('    ' + rule + '\n')
        if rules:
            additions.append((end, end, '\n    # CurveLead public legal URLs\n' + ''.join(rules)))
    for start, end, text in sorted(additions, reverse=True):
        source = source[:start] + text + source[end:]
    return source, matches


def main():
    config = subprocess.run(['nginx', '-T'], check=True, capture_output=True, text=True).stdout
    paths = {pathlib.Path(name).resolve() for name in re.findall(r'^# configuration file (.+):$', config, re.M)}
    originals, updates, matches = {}, {}, 0
    for path in paths:
        source = path.read_text()
        updated, count = update_config(source)
        matches += count
        if updated != source:
            originals[path], updates[path] = source, updated
    if not matches:
        raise RuntimeError('No explicit curvelead.com nginx server found; no files changed')
    try:
        for path, updated in updates.items():
            path.write_text(updated)
        subprocess.run(['nginx', '-t'], check=True)
        if updates:
            subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
    except BaseException:
        for path, source in originals.items():
            path.write_text(source)
        subprocess.run(['nginx', '-t'], check=True)
        if updates:
            subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
        raise
    print('Verified CurveLead legal 301 redirects in', matches, 'server block(s)')


if __name__ == '__main__':
    main()
