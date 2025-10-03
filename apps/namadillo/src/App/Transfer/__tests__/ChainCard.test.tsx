import { Chain } from "@chain-registry/types";
import { render, screen } from "@testing-library/react";
import { randomChainMock } from "App/Common/__mocks__/chains";
import { ChainCard } from "App/Transfer/ChainCard";

describe("Component: ChainCard", () => {
  it("renders the chain's name", () => {
    render(<ChainCard chain={randomChainMock as Chain} />);
    expect(screen.getByText(randomChainMock.pretty_name!)).toBeInTheDocument();
  });

  it("renders the chain's logo", () => {
    render(<ChainCard chain={randomChainMock as Chain} />);
    const logo = screen.getByAltText(`${randomChainMock.pretty_name!} logo`);
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", randomChainMock.logo_URIs?.svg);
  });

  it("renders the chain's logo in png when svg is not defined", () => {
    const chainWithoutSvg = {
      ...randomChainMock,
      logo_URIs: { png: "png-image.png" },
    };
    render(<ChainCard chain={chainWithoutSvg as Chain} />);
    const logo = screen.getByAltText(`${randomChainMock.pretty_name!} logo`);
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", randomChainMock.logo_URIs?.png);
  });
});
