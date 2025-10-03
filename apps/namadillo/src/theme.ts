export const colors = {
  bond: "#00ffff",
  balance: "#ffffff",
  unbond: "#DD1599",
  shielded: "#ffff00",
  empty: "#2F2F2F",
};

export const keyframes = {
  niceSpin: {
    "0%": { transform: "rotateZ(0)" },
    "25%, 90%": { transform: "rotateZ(180deg)" },
    "100%": { transform: "rotateZ(360deg)" },
  },
  loading: {
    from: {
      transform: "rotate(0turn)",
    },
    to: {
      transform: "rotate(1turn)",
    },
  },
  pulseFast: {
    "0%": { opacity: 1 },
    "50%": { opacity: 0.75 },
  },
  revealFromTop: {
    "0%": { clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)" },
    "50%": { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" },
    "100%": { clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)" },
  },
};

export const animation = {
  niceSpin: "niceSpin 1s ease-out infinite 1s",
  loadingSpinner: "loading 1s ease infinite",
  pulseFast: "pulseFast 1.25s infinite ease-in",
  revealFromTop: "revealFromTop 0.75s linear infinite",
};
