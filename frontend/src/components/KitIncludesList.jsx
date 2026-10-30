import React, { useMemo } from 'react';
import { resolveKitIncludes } from '../utils/kitIconResolver';

const KitIncludesList = ({
  includes = [],
  title = 'Kit includes',
  className = '',
  showTitle = true,
}) => {
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const tickUrl = `${basePath}/icons/processed/Tick.png`;

  const items = useMemo(() => {
    return resolveKitIncludes(includes, basePath);
  }, [includes, basePath]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={`hero-include-list${className ? ` ${className}` : ''}`}>
      {showTitle && title && <h3>{title}</h3>}
      <ul>
        {items.map((item, index) => (
          <li key={`${item.title}-${index}`} className="include-row">
            <div className="include-tick-col">
              <img
                src={tickUrl}
                alt="Included"
                className="include-tick-icon"
                width="22"
                height="22"
              />
            </div>
            <div className="include-icon-box">
              <img
                src={item.iconUrl}
                alt=""
                aria-hidden="true"
                className="include-resource-icon"
                width="22"
                height="22"
              />
            </div>
            <span className="include-title">{item.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default KitIncludesList;
