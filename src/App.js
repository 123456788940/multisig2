import React, { useState, useEffect } from 'react';

import MultiSigWalletContract from './multisig.json';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [transactionData, setTransactionData] = useState({
    to: '',
    value: 0,
    data: '',
  });
  const [pendingTransactions, setPendingTransactions] = useState([]);

  useEffect(() => {
    async function init() {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const web3 = window.ethereum;

          // Get list of accounts
          const accs = await web3.request({ method: 'eth_accounts' });
          setAccounts(accs);

          // Instantiate the contract
          const contractAddress = MultiSigWalletContract.address;
          const contract = new web3.Contract(MultiSigWalletContract.abi, contractAddress);
          setContract(contract);

          // Load pending transactions
          const pending = await contract.methods.getPendingTransactions().call();
          setPendingTransactions(pending);
        } catch (error) {
          console.error('Error connecting to Ethereum:', error);
        }
      }
    }

    init();
  }, []);

  async function submitTransaction() {
    try {
      await contract.methods
        .submit_transaction(
          transactionData.to,
          transactionData.value,
          transactionData.data
        )
        .send({ from: accounts[0] });
      // Clear form after submission
      setTransactionData({ to: '', value: 0, data: '' });
    } catch (error) {
      console.error('Error submitting transaction:', error);
    }
  }

  async function confirmTransaction(transactionId) {
    try {
      await contract.methods.confirmTransactions(transactionId).send({ from: accounts[0] });
      // Refresh pending transactions after confirmation
      const pending = await contract.methods.getPendingTransactions().call();
      setPendingTransactions(pending);
    } catch (error) {
      console.error('Error confirming transaction:', error);
    }
  }

  async function executeTransaction(transactionId) {
    try {
      await contract.methods.executeTransaction(transactionId).send({ from: accounts[0] });
      // Refresh pending transactions after execution
      const pending = await contract.methods.getPendingTransactions().call();
      setPendingTransactions(pending);
    } catch (error) {
      console.error('Error executing transaction:', error);
    }
  }

  return (
    <div className="App">
      <h1>Multi-Signature Wallet</h1>
      <p>Connected Account: {accounts[0]}</p>
      <div>
        <h2>Submit Transaction</h2>
        <label>
          To:
          <input
            type="text"
            value={transactionData.to}
            onChange={(e) =>
              setTransactionData({ ...transactionData, to: e.target.value })
            }
          />
        </label>
        <label>
          Value:
          <input
            type="number"
            value={transactionData.value}
            onChange={(e) =>
              setTransactionData({
                ...transactionData,
                value: parseInt(e.target.value),
              })
            }
          />
        </label>
        <label>
          Data:
          <input
            type="text"
            value={transactionData.data}
            onChange={(e) =>
              setTransactionData({ ...transactionData, data: e.target.value })
            }
          />
        </label>
        <button onClick={submitTransaction}>Submit</button>
      </div>
      <div>
        <h2>Pending Transactions</h2>
        <ul>
          {pendingTransactions.map((tx, index) => (
            <li key={index}>
              <p>To: {tx.to}</p>
              <p>Value: {tx.value}</p>
              <p>Data: {tx.data}</p>
              <button onClick={() => confirmTransaction(index)}>Confirm</button>
              <button onClick={() => executeTransaction(index)}>Execute</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
