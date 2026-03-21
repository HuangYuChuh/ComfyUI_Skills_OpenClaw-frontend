export function isInputLikeElement(target: HTMLElement | null) {
  return Boolean(
    target
      && (target.tagName === "INPUT"
        || target.tagName === "TEXTAREA"
        || target.tagName === "SELECT"
        || target.isContentEditable),
  );
}
