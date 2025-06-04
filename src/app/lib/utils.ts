export const extractIdFromUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("id");
  } catch (error) {
    console.error("Error during parsing url:", error);
    return null;
  }
};
