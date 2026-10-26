import { relative } from 'node:path';
import { cli, filesAt } from './lib.mjs';
import { publicationReader } from './publication-values.mjs';
import { readPublication } from './publication-reader.mjs';
import { normalizeText } from './publication/normalization.mjs';
