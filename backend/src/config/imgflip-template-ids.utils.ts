export function parseImgflipTemplateIds(raw: string): number[] {
  const rawParts = raw.split(',');

  if (rawParts.some((part) => part.trim().length === 0)) {
    throw new Error('IMGFLIP_TEMPLATE_IDS must not contain empty values');
  }

  const parts = rawParts.map((part) => part.trim());

  if (parts.length < 2) {
    throw new Error(
      'IMGFLIP_TEMPLATE_IDS must contain at least two comma-separated template IDs',
    );
  }

  const templateIds: number[] = [];
  const seen = new Set<number>();

  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      throw new Error(
        'IMGFLIP_TEMPLATE_IDS must contain only positive numeric template IDs',
      );
    }

    const templateId = Number(part);

    if (!Number.isSafeInteger(templateId) || templateId <= 0) {
      throw new Error(
        'IMGFLIP_TEMPLATE_IDS must contain only positive numeric template IDs',
      );
    }

    if (seen.has(templateId)) {
      throw new Error('IMGFLIP_TEMPLATE_IDS must not contain duplicate values');
    }

    seen.add(templateId);
    templateIds.push(templateId);
  }

  return templateIds;
}

export function buildTemplatePoolVersion(templateIds: number[]): string {
  return [...templateIds].sort((left, right) => left - right).join(',');
}
