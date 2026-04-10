import Handlebars, { TemplateDelegate } from 'handlebars';
import { ITemplateRenderer } from '@/application/services/template-renderer';
import { ICacheService } from '@/application/services/cache.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { inject } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import { getEnvs } from '@/shared/utils/getEnv';
const config = getEnvs({
  TEMPLATE_BASE_DIR: {
    required: true,
  },
});

export class HandlebarsTemplateRendererAdapter implements ITemplateRenderer {
  private readonly cachePrefix = 'template';
  private readonly cacheExpiry = 60 * 60 * 24 * 10; // 10 days, in seconds

  public constructor(
    @inject(TYPES.ICacheService)
    private readonly cache: ICacheService,
    private readonly baseDir: string = config.TEMPLATE_BASE_DIR.toString(),
  ) {
    this.registerHelpers();
    this.baseDir = path.resolve(this.baseDir);
  }

  /**
   * Registers shared Handlebars helpers.
   */
  private registerHelpers(): void {
    Handlebars.registerHelper('formatDate', (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (!(d instanceof Date) || isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    Handlebars.registerHelper(
      'ifEquals',
      function (this: unknown, arg1: unknown, arg2: unknown, options: any) {
        // 'this' comes from Handlebars context
        return arg1 === arg2 ? options.fn(this) : options.inverse(this);
      },
    );

    Handlebars.registerHelper('uppercase', (str: string) =>
      typeof str === 'string' ? str.toUpperCase() : '',
    );

    Handlebars.registerHelper('capitalize', (str: string) =>
      typeof str === 'string' && str.length > 0 ? str.charAt(0).toUpperCase() + str.slice(1) : '',
    );
  }

  /**
   * Render a template file by name from the normalized baseDir.
   * File name should include extension (e.g., my-email.hbs).
   */
  public async render<TContext = Record<string, unknown>>(
    templateFile: string,
    data: TContext,
  ): Promise<string> {
    const normalizedName = path.normalize(templateFile);
    const cacheKey = this.getCacheKey(normalizedName);
    let compiledTemplate: TemplateDelegate | null =
      await this.cache.get<TemplateDelegate>(cacheKey);

    if (!compiledTemplate) {
      const templateString = await this.loadTemplate(normalizedName);
      compiledTemplate = Handlebars.compile(templateString, {
        strict: false,
        noEscape: false,
      });
      await this.cache.set(cacheKey, compiledTemplate, this.cacheExpiry);
    }
    try {
      return compiledTemplate(data);
    } catch (err: any) {
      throw new Error(`Failed to render template "${templateFile}": ${err?.message || err}`);
    }
  }

  /**
   * Render a Handlebars template from a raw string (not cached).
   */
  public async renderFromString<TContext = Record<string, unknown>>(
    templateString: string,
    data: TContext,
  ): Promise<string> {
    try {
      const compiledTemplate = Handlebars.compile(templateString, {
        strict: false,
        noEscape: false,
      });
      return compiledTemplate(data);
    } catch (err: any) {
      throw new Error(`Failed to render template from string: ${err?.message || err}`);
    }
  }

  /**
   * Remove a specific compiled template from the cache.
   */
  public async removeCachedTemplate(templateFile: string): Promise<void> {
    const normalizedName = path.normalize(templateFile);
    const cacheKey = this.getCacheKey(normalizedName);
    await this.cache.delete(cacheKey);
  }

  /**
   * Loads a template file as a string from disk.
   * Ensures correct joining & normalization of path.
   * Throws if not found or access error.
   */
  private async loadTemplate(templateFile: string): Promise<string> {
    const templatePath = this.getTemplatePath(templateFile);
    try {
      return await fs.readFile(templatePath, 'utf-8');
    } catch (err: any) {
      if (err?.code === 'ENOENT') {
        throw new Error(`Template "${templateFile}" not found at path: ${templatePath}`);
      }
      throw new Error(`Failed to load template "${templateFile}": ${err?.message || err}`);
    }
  }

  /**
   * Checks if a template file exists at the expected path.
   */
  public async templateExists(templateFile: string): Promise<boolean> {
    const templatePath = this.getTemplatePath(templateFile);
    try {
      await fs.access(templatePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Path resolution for a template file relative to normalized baseDir.
   * Expects the file name to already include its extension.
   */
  private getTemplatePath(templateFile: string): string {
    // The templateFile may be a relative path, ensure it's safe
    return path.join(this.baseDir, path.normalize(templateFile));
  }

  private getCacheKey(templateFile: string): string {
    return `${this.cachePrefix}:${templateFile}`;
  }
}
