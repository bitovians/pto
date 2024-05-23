export const SETTINGS_KEY = "settings";

export function getConfigParams() {
  const queryParams = new URLSearchParams(window.location.search);
  const updatedSettings = Object.fromEntries(queryParams.entries());

  try {
    const existingSettings = JSON.parse(
      window.localStorage.getItem(SETTINGS_KEY) || "{}"
    );
    const newSettings = {
      ...existingSettings,
      ...updatedSettings,
    };
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    return newSettings;
  } catch (error) {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    return updatedSettings;
  }
}