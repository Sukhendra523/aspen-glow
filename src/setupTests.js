import "@testing-library/jest-dom";

if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = function getContextStub() {
    return null;
  };
}
