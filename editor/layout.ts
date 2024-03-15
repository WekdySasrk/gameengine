export function layout(
  layoutData: { x: number; y: number; width: number; height: number },
  div: HTMLElement
) {
  div.style.top = layoutData.y + "px";
  div.style.left = layoutData.x + "px";
  div.style.width = layoutData.width + "px";
  div.style.height = layoutData.height + "px";
}
