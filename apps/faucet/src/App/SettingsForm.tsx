import { ActionButton, Input } from "@namada/components";
import { FaucetAppContext } from "App/FaucetApp";
import React, { useContext, useEffect, useState } from "react";
import { endpoint } from "utils";
import {
  ButtonContainer,
  InputContainer,
  SettingsContainer,
  SettingsFormContainer,
} from "./App.components";

export const SettingsForm: React.FC = () => {
  const [isFormValid, setIsFormValid] = useState(false);
  const { setIsModalOpen, baseUrl, setUrl } = useContext(FaucetAppContext)!;
  const [apiUrl, setApiUrl] = useState(baseUrl);

  useEffect(() => {
    validateUrl(baseUrl);
  }, []);

  const validateUrl = (url: string): void => {
    try {
      new URL(url);
      setIsFormValid(true);
    } catch {
      setIsFormValid(false);
    }
  };

  const handleSetUrl = (url: string): void => {
    // Strip endpoint from URL if it was provided
    const updatedUrl = url.replace(endpoint, "").replace(/\/$/, "");
    setUrl(updatedUrl);
    localStorage.setItem("baseUrl", updatedUrl);
    setIsModalOpen(false);
  };

  return (
    <SettingsContainer>
      <SettingsFormContainer>
        <InputContainer>
          <Input
            label="Set Faucet API URL"
            value={apiUrl}
            onChange={(e) => {
              setApiUrl(e.target.value);
              validateUrl(e.target.value);
            }}
            autoFocus={true}
          />
        </InputContainer>
        <ButtonContainer>
          <ActionButton
            onClick={() => handleSetUrl(apiUrl)}
            disabled={!isFormValid || apiUrl === baseUrl}
          >
            Update URL
          </ActionButton>
        </ButtonContainer>
      </SettingsFormContainer>
    </SettingsContainer>
  );
};
