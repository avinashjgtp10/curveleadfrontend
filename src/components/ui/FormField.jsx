import { cloneElement, useId } from 'react';

// Design-system form row: a label linked to its input, the error inline under the field
// (announced to screen readers), or a hint when there's no error. Wrap one input:
//   <FormField label="Email" error={errors.email}><input value={...} /></FormField>
const FormField = ({ label, required, error, hint, children, className = '' }) => {
  const id = useId();
  const inputId = children.props.id || `field-${id}`;
  const msgId = `${inputId}-msg`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-gray-600">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {cloneElement(children, {
        id: inputId,
        required: required || children.props.required,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error || hint ? msgId : undefined,
        className: `${children.props.className || ''} ${error ? 'border-red-400' : ''}`.trim(),
      })}
      {error
        ? <p id={msgId} role="alert" className="mt-1 text-xs text-red-500">{error}</p>
        : hint && <p id={msgId} className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
};

export default FormField;
