import React, { useEffect, useState } from "react";
import "./DashBoardPage.css";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "N/A";
  return Number(amount).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });
};

function DashboardPage() {
  const [profileData, setProfileData] = useState(null);
  const [accountData, setAccountData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTransactions, setShowTransactions] = useState(false);
  const [amount, setAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const profile = await (await fetch("http://localhost:8080/api/profile")).json();
      const account = await (await fetch("http://localhost:8080/api/account")).json();
      setProfileData(profile);
      setAccountData(account);
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeposit = async () => {
    if (!amount || Number(amount) <= 0) return alert("Enter valid amount");
    try {
      setActionType("deposit");
      setActionLoading(true);
      await fetch("http://localhost:8080/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      setAmount("");
      fetchDashboardData();
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionType(null), 600);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || Number(amount) <= 0) return alert("Enter valid amount");
    try {
      setActionType("withdraw");
      setActionLoading(true);
      await fetch("http://localhost:8080/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      setAmount("");
      fetchDashboardData();
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionType(null), 600);
    }
  };

  if (isLoading) return <div className="dashboard-container">Loading...</div>;
  if (error) return <div className="dashboard-container">{error}</div>;

  return (
    <div className="app-wrapper">
      <div className="dashboard-container">
        <h2 className="welcome-heading">
          Welcome, {profileData?.full_name || "User"} 👋
        </h2>

        <div className="dashboard-content-layout">
          <section className="card">
            <h3>Profile</h3>
            <dl>
              <dt>Name:</dt><dd>{profileData.full_name}</dd>
              <dt>Email:</dt><dd>{profileData.email_address}</dd>
              <dt>Customer ID:</dt><dd>{profileData.customer_id}</dd>
            </dl>
          </section>

          <section className={`card ${actionType === "deposit" ? "card-deposit" : actionType === "withdraw" ? "card-withdraw" : ""}`}>
            <h3>Account</h3>
            <dl>
              <dt>Account #:</dt><dd>{accountData.account_number}</dd>
              <dt>Balance:</dt><dd>{formatCurrency(accountData.account_balance)}</dd>
            </dl>

            <div className="transaction-actions">
              <input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <button className="deposit-btn" onClick={handleDeposit} disabled={actionLoading}>Deposit</button>
              <button className="withdraw-btn" onClick={handleWithdraw} disabled={actionLoading}>Withdraw</button>
            </div>

            <button className="transactions-button" onClick={() => setShowTransactions(!showTransactions)}>
              {showTransactions ? "Hide Transactions" : "View Transactions"}
            </button>
          </section>
        </div>

        {showTransactions && (
          <section className="card transactions-card">
            <h3>Recent Transactions</h3>
            <table className="transactions-table">
              <thead>
                <tr><th>Date</th><th>Type</th><th>Amount</th><th>Balance</th></tr>
              </thead>
              <tbody>
                {accountData.transactions.map((t) => {
                  const diff = Number(t.amount_after) - Number(t.amount_before);
                  return (
                    <tr key={t.transaction_number}>
                      <td>{formatDate(t.timestamp)}</td>
                      <td>{t.type}</td>
                      <td className={diff >= 0 ? "positive-amount" : "negative-amount"}>
                        {formatCurrency(diff)}
                      </td>
                      <td>{formatCurrency(t.amount_after)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
