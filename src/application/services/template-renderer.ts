export interface ITemplateRenderer<TContext = Record<string, unknown>> {
  /**
   * Renders an email template by its name using the provided data.
   *
   * @param templateName - The name of the template to render (e.g., 'welcome-email').
   * @param data - The data object to be injected into the template.
   * @returns Promise that resolves to the rendered template as a string.
   */
  render(templateName: string, data: TContext): Promise<string>;

  /**
   * Renders a template directly from a raw template string using the provided data.
   *
   * @param templateString - The raw template string written in the template language (e.g., Handlebars format).
   * @param data - The data object to be injected into the template.
   * @returns Promise that resolves to the rendered template as a string.
   */
  renderFromString(templateString: string, data: TContext): Promise<string>;

  /**
   * Checks if a template with the given name exists.
   *
   * @param templateName - The name of the template to check for existence.
   * @returns Promise that resolves to true if the template exists, false otherwise.
   */
  templateExists(templateName: string): Promise<boolean>;
}
