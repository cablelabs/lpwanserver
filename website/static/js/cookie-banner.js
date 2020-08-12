window.addEventListener("load", () => {
  const ack = localStorage.getItem("acknowledgedCookieUsage");
  if (ack === "true") return;
  const banner = document.querySelector("#cookieBanner");
  banner.classList.add("show");
  const button = banner.querySelector("button");
  const handler = () => {
    button.removeEventListener("click", handler);
    localStorage.setItem("acknowledgedCookieUsage", "true");
    banner.classList.remove("show");
  };
  button.addEventListener("click", handler);
});
