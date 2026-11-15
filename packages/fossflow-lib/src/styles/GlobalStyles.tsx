import React from 'react';
import { GlobalStyles as MUIGlobalStyles } from '@mui/material';
import 'react-quill-new/dist/quill.snow.css';

export const GlobalStyles = () => {
  return (
    <MUIGlobalStyles
      styles={{
        div: {
          boxSizing: 'border-box'
        },
        '@keyframes fossflow-flow': {
          from: { strokeDashoffset: 0 },
          to: { strokeDashoffset: 'var(--fossflow-flow-distance, -40px)' }
        },
        '@keyframes fossflow-pulse': {
          '0%': { transform: 'scale(1)', opacity: 0.9 },
          '70%': { transform: 'scale(2.4)', opacity: 0 },
          '100%': { transform: 'scale(2.4)', opacity: 0 }
        },
        '@media (prefers-reduced-motion: reduce)': {
          '.fossflow-connector-flow, .fossflow-status-pulse': {
            animation: 'none !important'
          }
        }
      }}
    />
  );
};
