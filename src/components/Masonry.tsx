import * as React from "react";

type MasonryProps = {
  breakpoints?: (Record<number, number> & { default?: number }) | number;
  gap?: string;
  className?: string;
  children: React.ReactNode;
};

const DEFAULT_COLUMNS = 4;
const DEFAULT_GAP = "40px";

export function Masonry({
  breakpoints = DEFAULT_COLUMNS,
  gap = DEFAULT_GAP,
  children,
}: MasonryProps) {
  const defaultCols =
    typeof breakpoints === "number"
      ? breakpoints
      : breakpoints.default || DEFAULT_COLUMNS;

  const [cols, setCols] = React.useState(defaultCols);
  const lastAnimationFrameRef = React.useRef<number | null>(null);

  const calculateColumn = React.useCallback(() => {
    const windowWidth = (window && window.innerWidth) || Infinity;

    let bp =
      typeof breakpoints !== "object"
        ? { default: breakpoints || DEFAULT_COLUMNS }
        : breakpoints;
    let matchBreakpoint = Infinity;
    let { default: col = DEFAULT_COLUMNS, ...breakpointOptions } = bp;
    const bpKeys = Object.keys(breakpointOptions);

    for (let i = 0; i < bpKeys.length; i++) {
      const size = parseInt(bpKeys[i]);
      const isBreakpoint = size > 0 && windowWidth <= size;

      if (isBreakpoint && size < matchBreakpoint) {
        matchBreakpoint = size;
        col = bp[size];
      }
    }

    setCols(Math.max(1, col));
  }, []);

  const calculateColumnDebounce = React.useCallback(() => {
    if (!window || !window.requestAnimationFrame) {
      calculateColumn();
      return;
    }

    if (window.cancelAnimationFrame && lastAnimationFrameRef.current) {
      window.cancelAnimationFrame(lastAnimationFrameRef.current);
    }

    lastAnimationFrameRef.current = window.requestAnimationFrame(() => {
      calculateColumn();
    });
  }, []);

  React.useEffect(() => {
    calculateColumn();

    window.addEventListener("resize", calculateColumnDebounce);

    return () => {
      window.removeEventListener("resize", calculateColumnDebounce);
    };
  }, []);

  const childs = React.useMemo(() => {
    const items = new Array(cols);
    const childrens = React.Children.toArray(children);

    for (let i = 0; i < childrens.length; i++) {
      const columnIndex = i % cols;

      if (!items[columnIndex]) {
        items[columnIndex] = [];
      }

      items[columnIndex].push(childrens[i]);
    }

    return items;
  }, [cols, children]);

  const columnWidth = `${100 / childs.length}%`;

  return (
    <div className="flex w-auto" style={{ gap }}>
      {childs.map((child, i) => (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: columnWidth,
            gap,
          }}
          key={i}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
