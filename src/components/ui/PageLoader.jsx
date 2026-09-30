const PageLoader = ({ message = "Loading data…", minHeight = "min-h-64" }) => (
  <div role="status" aria-label={message} className={`w-full p-4 ${minHeight}`}>
    <span className="sr-only">{message}</span>
    <div
      aria-hidden="true"
      className="animate-pulse motion-reduce:animate-none space-y-5"
    >
      <div className="h-6 w-1/3 rounded bg-gray-200" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100" />
        ))}
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 rounded bg-gray-100" />
      ))}
    </div>
  </div>
);
export default PageLoader;
