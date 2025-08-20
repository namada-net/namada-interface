import { useEffect, useState } from "react";
import { ThemeProvider } from "styled-components";

import { ColorMode, getTheme } from "@namada/utils";

import { GlobalStyles } from "App/App.components";

import { Config, getConfig } from "config";
import { FaucetApp } from "./FaucetApp";

export const App = (): JSX.Element => {
  const initialColorMode = "dark";
  const [config, setConfig] = useState<Config>();
  const [colorMode, _] = useState<ColorMode>(initialColorMode);
  const theme = getTheme(colorMode);

  useEffect(() => {
    getConfig().then((config) => setConfig(config));
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles colorMode={colorMode} />
      {config && <FaucetApp config={config} />}
    </ThemeProvider>
  );
};
