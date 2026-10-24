const $ = (id) => document.getElementById(id);
const btn = $("scanBtn");
const body = $("resultsBody");
const notice = $("notice");
const timeframePairs = {"1d":["4h","1h"],"4h":["1h","15m"],"1h":["15m","3m"],"15m":["3m","1m"]};
const labels = {"1m":"1M","3m":"3M","15m":"15M","1h":"1H","4h":"4H","1d":"1D"};

function setNotice(message, error=false) {
  notice.textContent = message;
  notice.classList.toggle("error", error);
}
function timeframeLabel(tf) { return labels[tf] || tf; }
function updatePair() {
  const [higher, lower] = timeframePairs[$("mainTf").value];
  $("coinPair").textContent = `${timeframeLabel(higher)} + ${timeframeLabel(lower)}`;
}
function renderRows(results) {
  body.innerHTML = "";
  if (!results.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 2;
    td.className = "empty";
    td.textContent = "No LONG or SHORT setup matches the current rules.";
    tr.appendChild(td); body.appendChild(tr); return;
  }
  for (const item of results) {
    const tr = document.createElement("tr");
    const coin = document.createElement("td");
    coin.className = "coin";
    coin.textContent = item.coin;
    const sig = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "signal " + item.signal.toLowerCase();
    badge.textContent = item.signal;
    sig.appendChild(badge); tr.append(coin, sig); body.appendChild(tr);
  }
}
async function scan() {
  btn.disabled = true;
  btn.textContent = "Scanning…";
  setNotice("Fetching Bitunix candles and checking the latest closed MACD values on all three timeframes. A broad scan can take a little time.");
  $("biasValue").textContent = "…";
  $("scannedValue").textContent = "…";
  $("setupValue").textContent = "…";
  try {
    const response = await fetch("/api/scan?" + new URLSearchParams({
      timeframe: $("mainTf").value,
      limit: $("coinLimit").value
    }).toString(), {cache:"no-store"});
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Scan failed.");
    $("biasValue").textContent = data.btc_bias;
    $("biasValue").className = data.btc_bias === "LONG" ? "green" : data.btc_bias === "SHORT" ? "red" : "neutral";
    $("biasSub").textContent = "BTC MACD · " + timeframeLabel(data.bias_timeframe);
    $("scannedValue").textContent = data.scanned;
    $("setupValue").textContent = data.results.length;
    renderRows(data.results);
    const time = new Date(data.last_scan_utc).toLocaleString();
    $("lastScan").textContent = `Last scan: ${time} · Coin MACD: ${timeframeLabel(data.coin_higher_timeframe)} + ${timeframeLabel(data.coin_lower_timeframe)}`;
    setNotice(data.results.length
      ? `${data.results.length} setup(s) found. ${data.errors} timeframe check(s) could not be evaluated.`
      : `No matching setups. BTC bias is ${data.btc_bias}. ${data.errors} timeframe check(s) could not be evaluated.`);
  } catch (err) {
    setNotice(err.message || "Unable to reach the scanner. Try again.", true);
    $("biasValue").textContent = "ERROR";
    $("scannedValue").textContent = "—";
    $("setupValue").textContent = "—";
    renderRows([]);
  } finally {
    btn.disabled = false;
    btn.textContent = "↻ Scan market";
  }
}
$("mainTf").addEventListener("change", updatePair);
btn.addEventListener("click", scan);
updatePair();
