import { Chain } from "@chain-registry/types";
import { ActionButton, Heading, Stack } from "@namada/components";
import svgImg from "App/Assets/ShieldedParty.svg";
import { SelectChainModal } from "App/Transfer/SelectChainModal";
import { getAvailableChains } from "atoms/integrations";
import { wallets } from "integrations";
import { useMemo, useState } from "react";
import { ShieldAllContainer } from "./ShieldAllContainer";

type ShieldAllIntroProps = {
  onSelectChain: (chain: Chain) => void;
};

export const ShieldAllIntro = ({
  onSelectChain,
}: ShieldAllIntroProps): JSX.Element => {
  const [displayChainModal, setDisplayChainModal] = useState(false);
  const chainList = useMemo(getAvailableChains, []);

  return (
    <>
      <ShieldAllContainer>
        <Stack gap={3} className="text-center">
          <img className="w-[280px] mx-auto" src={`${svgImg}`} />
          <Heading className="text-black uppercase text-5xl" level="h2">
            Shield All
          </Heading>
          <p className="max-w-[360px] mx-auto">
            Shield all transfers all your assets to Namada to get quick and easy
            data protection and maximise your rewards
          </p>
          <ActionButton
            className="w-48 mx-auto mt-2"
            backgroundColor="black"
            backgroundHoverColor="cyan"
            textColor="yellow"
            textHoverColor="black"
            onClick={() => setDisplayChainModal(true)}
          >
            Connect Wallet
          </ActionButton>
        </Stack>
      </ShieldAllContainer>
      {displayChainModal && (
        <SelectChainModal
          chains={chainList}
          wallet={wallets.namada}
          onSelect={onSelectChain}
          onClose={() => setDisplayChainModal(false)}
        />
      )}
    </>
  );
};
