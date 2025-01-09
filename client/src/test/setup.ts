import ResizeObserver from 'resize-observer-polyfill';
import "@testing-library/jest-dom"; // Provides additional matchers for testing DOM

global.ResizeObserver = ResizeObserver;
