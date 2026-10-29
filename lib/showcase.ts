// Finished jobs shown on the Showcase page. To add one: drop the photo in /public/showcase and add a line here.
// Example: { src: "/showcase/wheel-build.jpg", title: "Custom wheel build", service: "Bike building" }
export interface Work {
  src: string;
  title: string;
  service: string;
}

export const WORKS: Work[] = [];
