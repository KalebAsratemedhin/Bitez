declare module "swagger-jsdoc" {
  const swaggerJsdoc: (options: { definition: object; apis: string[] }) => object;
  export default swaggerJsdoc;
}

declare module "swagger-ui-express" {
  import type { RequestHandler } from "express";
  function serve(): RequestHandler;
  function setup(spec: object): RequestHandler;
}
