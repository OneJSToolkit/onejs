class Encode {
  public static toHtml(val: string): string {
    return Encode.toSafe(val);
  }

  public static toHtmlAttr(val: string): string {
    return Encode.toHtml(val);
  }

  public static toJS(val: string): string {
    return val || '';
  }

  public static toUrl(val: string): string {
    return Encode.toSafe(val);
  }

  public static toSafe(val: string): string {
    return val || '';
  }
}

export = Encode;
