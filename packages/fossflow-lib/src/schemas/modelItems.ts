import { z } from 'zod';
import { id, constrainedStrings } from './common';

export const modelItemSchema = z.object({
  id,
  name: constrainedStrings.name,
  description: constrainedStrings.description.optional(),
  icon: id.optional(),
  // Key looked up in the live status feed (e.g. "oxigeno-tech")
  statusKey: z.string().max(200).optional()
});

export const modelItemsSchema = z.array(modelItemSchema);
