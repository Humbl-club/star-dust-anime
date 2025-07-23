export const importWhenVisible = (
  elementId: string,
  importFn: () => Promise<any>
) => {
  if (typeof window === 'undefined') return;
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          importFn();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.1 }
  );
  
  const element = document.getElementById(elementId);
  if (element) observer.observe(element);
};

export const importOnInteraction = (
  elementId: string,
  importFn: () => Promise<any>,
  events = ['click', 'focus']
) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const handler = () => {
    importFn();
    events.forEach(event => element.removeEventListener(event, handler));
  };
  
  events.forEach(event => element.addEventListener(event, handler));
};