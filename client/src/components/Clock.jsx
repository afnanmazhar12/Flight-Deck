import React, { useState, useEffect } from 'react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const utcTime = time.toISOString().slice(11, 19);
  const localTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' local';

  return (
    <div className="clk" aria-label="Current time">
      <b id="utc">{utcTime}</b>
      <small>UTC</small>
      <span className="lcl" id="lcl">{localTime}</span>
    </div>
  );
}
