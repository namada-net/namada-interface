import { Text } from "@namada/components";
import { FaqContainer, FaqUrl } from "./Faq.components";
import { FaqDropdown } from "./FaqDropdown";

const namadaDiscord = "https://discord.com/invite/namada";
const becomeValidatorUrl =
  "https://docs.namada.net/operators/validators/post-genesis-validator-setup";

export const Faq = (): JSX.Element => {
  return (
    <FaqContainer>
      <Text className="text-black text-5xl my-0">FAQs</Text>
      <FaqDropdown title="How do I use this?">
        <Text className="text-black my-0">
          To request funds, simply enter your wallet address and hit “Get
          Testnet Tokens”.
        </Text>
        <div style={{ marginTop: "16px" }}></div>
        <Text className="text-black my-0">
          See the{' "'}
          <FaqUrl href={becomeValidatorUrl}>
            {"Generating a validator account"}
          </FaqUrl>
          {'" '}
          section if you need to create a new address.
        </Text>
      </FaqDropdown>
      <FaqDropdown title="How can I use these tokens?">
        <Text className="text-black my-0">
          These are test coins on a test network and do not have any real value
          for regular users. They are designed for developers to test and
          develop their applications without using real money. Please note that
          these test coins are not transferable to the main network and cannot
          be exchanged for real money or other cryptocurrencies.
        </Text>
      </FaqDropdown>
      <FaqDropdown title="The faucet confirmed that it sent me tokens, but I still have not received them">
        <Text className="text-black my-0">
          The time required to receive test tokens may vary. It depends on the
          speed of the blocks in the current chain.
        </Text>
        <div style={{ marginTop: "16px" }}></div>
        <Text className="text-black my-0">
          If more than a few hours have passed and you still have not received
          your tokens, please email us at{" "}
          <FaqUrl href={namadaDiscord}>{"Discord!"}</FaqUrl>
        </Text>
      </FaqDropdown>
      <FaqDropdown title="What if the faucet doesn't work?">
        <Text className="text-black my-0">
          <FaqUrl href={namadaDiscord}>{"Join our Discord"}</FaqUrl> to share
          any issues or questions you have relating to the faucet. We will
          definitely help!
        </Text>
      </FaqDropdown>
    </FaqContainer>
  );
};
