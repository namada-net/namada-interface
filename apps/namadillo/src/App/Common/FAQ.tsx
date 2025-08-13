import { Panel } from "@namada/components";

export const FAQ = (): JSX.Element => {
  const faqItems = [
    {
      question: "What software versions do I need?",
      answer: (
        <>
          <p>To use Namadillo properly, ensure you have:</p>
          <ul className="list-disc lista-inside ml-4 mt-2 space-y-1">
            <li>Namada Extension Wallet (latest version)</li>
            <li>For Ledger users: Ledger Live (latest version)</li>
            <li>For Ledger users: Namada app on Ledger (latest version)</li>
          </ul>
        </>
      ),
    },
    {
      question: "How do I check if my software is up to date?",
      answer: (
        <>
          <p>Follow these steps to verify your software versions:</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>
              <strong>Browser:</strong> Check your browser&apos;s About section
              for version info
            </li>
            <li>
              <strong>Extension Wallet:</strong> Go to chrome://extensions/ and
              check the version
            </li>
            <li>
              <strong>Ledger Live:</strong> Open Ledger Live and check for
              updates in Settings
            </li>
            <li>
              <strong>Ledger Namada App:</strong> Update through Ledger
              Live&apos;s Manager section
            </li>
          </ul>
        </>
      ),
    },
    {
      question: "Ledger troubleshooting - Connection issues",
      answer: (
        <>
          <p>If you&apos;re having trouble connecting your Ledger device:</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Ensure your Ledger device is unlocked</li>
            <li>Open the Namada app on your Ledger device</li>
            <li>Use a high-quality USB cable (avoid USB hubs)</li>
            <li>Close Ledger Live while using Namadillo</li>
            <li>Try a different USB port</li>
            <li>Restart your browser and try again</li>
          </ul>
        </>
      ),
    },
    {
      question: "Ledger troubleshooting - Transaction signing",
      answer: (
        <>
          <p>If transactions aren&apos;t signing properly with Ledger:</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Make sure the Namada app is open on your Ledger</li>
            <li>
              Check that &quot;Blind signing&quot; is enabled in Ledger Namada
              app settings
            </li>
            <li>
              Verify you&apos;re using the latest firmware on your Ledger device
            </li>
            <li>Try reducing the transaction amount if it&apos;s failing</li>
            <li>Ensure sufficient battery on your Ledger device</li>
          </ul>
        </>
      ),
    },
    {
      question: "Common sync and loading issues",
      answer: (
        <>
          <p>If Namadillo is not loading properly or sync is slow:</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Clear your browser cache and cookies for Namadillo</li>
            <li>Disable browser extensions that might interfere</li>
            <li>Check your internet connection stability</li>
            <li>Try using a different browser</li>
            <li>Wait for sync to complete - this can take several minutes</li>
            <li>Refresh the page if stuck on loading screen</li>
          </ul>
        </>
      ),
    },
    {
      question: "Transaction failures and errors",
      answer: (
        <>
          <p>If your transactions are failing:</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>
              Check that you have sufficient balance for the transaction + fees
            </li>
            <li>Verify the recipient address is correct</li>
            <li>Try reducing the transaction amount</li>
            <li>Wait a few minutes and try again (network congestion)</li>
            <li>For staking: ensure you meet minimum staking requirements</li>
            <li>For MASP: wait for shielded sync to complete first</li>
          </ul>
        </>
      ),
    },
    {
      question: "MASP (Privacy) related issues",
      answer: (
        <>
          <p>If you&apos;re having issues with shielded transactions:</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Allow time for the initial MASP sync to complete</li>
            <li>MASP sync can take 10-30 minutes depending on network</li>
            <li>Don&apos;t close the browser during MASP sync</li>
            <li>Shielded balances may not appear until sync is complete</li>
            <li>Try refreshing if sync appears stuck</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <Panel className="mb-12 min-h-full">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-neutral-300 max-w-2xl mx-auto">
            Common troubleshooting steps and solutions for using Namadillo. If
            you don&apos;t find your answer here, try our community help or file
            a bug report.
          </p>
        </div>

        <div className="space-y-6">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="bg-neutral-800 rounded-lg p-6 border border-neutral-700"
            >
              <h3 className="text-xl font-semibold text-yellow mb-3">
                {item.question}
              </h3>
              <div className="text-neutral-300 leading-relaxed">
                {item.answer}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-neutral-800 rounded-lg border border-neutral-700">
          <h3 className="text-xl font-semibold text-yellow mb-3">
            Still need help?
          </h3>
          <p className="text-neutral-300">
            If you couldn&apos;t find the answer to your question, you can:
          </p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-neutral-300">
            <li>Ask for help in our Discord community</li>
            <li>Report a bug if you think something is broken</li>
            <li>Check the official Namada documentation</li>
          </ul>
        </div>
      </div>
    </Panel>
  );
};
