import { Chain } from "@chain-registry/types";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { randomChainMock } from "App/Common/__mocks__/chains";
import { walletMock } from "App/Common/__mocks__/providers";
import { SelectedChain } from "App/Transfer/SelectedChain";

describe("Component: SelectedChain", () => {
  it("renders disabled with no provider selected", () => {
    render(<SelectedChain />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("renders empty when chain is passed, but provider is disconnected", () => {
    render(<SelectedChain chain={randomChainMock as Chain} />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.getAttribute("aria-description")).toMatch(/no chain/i);
  });

  it("renders correctly with no chain selected", () => {
    render(<SelectedChain wallet={walletMock} />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
    expect(button.getAttribute("aria-description")).toMatch(/no chain/i);
  });

  it("renders correctly with chain selected", () => {
    render(
      <SelectedChain chain={randomChainMock as Chain} wallet={walletMock} />
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button.getAttribute("aria-description")).toContain(
      randomChainMock.pretty_name
    );

    const chainName = screen.getByText(randomChainMock.pretty_name!);
    expect(chainName).toBeInTheDocument();

    const chainImage = screen.getByAltText(`${randomChainMock.pretty_name}`, {
      exact: false,
    });
    expect(chainImage).toBeInTheDocument();
    expect(chainImage).toHaveAttribute("src", randomChainMock.logo_URIs?.svg);
  });

  it("calls onClick when the component is clicked", () => {
    const handleClick = jest.fn();
    render(<SelectedChain onClick={handleClick} wallet={walletMock} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
