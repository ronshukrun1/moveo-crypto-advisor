import {
  buildTemplatePoolVersion,
  parseImgflipTemplateIds,
} from './imgflip-template-ids.utils';

describe('parseImgflipTemplateIds', () => {
  it('parses comma-separated positive numeric template IDs', () => {
    expect(parseImgflipTemplateIds('181913649, 112126428, 87743020')).toEqual([
      181913649, 112126428, 87743020,
    ]);
  });

  it('requires at least two template IDs', () => {
    expect(() => parseImgflipTemplateIds('181913649')).toThrow(/at least two/i);
  });

  it('rejects empty values', () => {
    expect(() => parseImgflipTemplateIds('181913649,,112126428')).toThrow(
      /empty values/i,
    );
  });

  it('rejects non-numeric values', () => {
    expect(() => parseImgflipTemplateIds('181913649,abc,87743020')).toThrow(
      /positive numeric/i,
    );
  });

  it('rejects zero and negative values', () => {
    expect(() => parseImgflipTemplateIds('181913649,0,87743020')).toThrow(
      /positive numeric/i,
    );
    expect(() => parseImgflipTemplateIds('181913649,-1,87743020')).toThrow(
      /positive numeric/i,
    );
  });

  it('rejects duplicate values', () => {
    expect(() =>
      parseImgflipTemplateIds('181913649,181913649,87743020'),
    ).toThrow(/duplicate/i);
  });
});

describe('buildTemplatePoolVersion', () => {
  it('returns a stable sorted version string', () => {
    expect(buildTemplatePoolVersion([87743020, 181913649, 112126428])).toBe(
      '87743020,112126428,181913649',
    );
  });
});
