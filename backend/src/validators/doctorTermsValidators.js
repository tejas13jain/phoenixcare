import { z } from 'zod';

export const acceptTermsSchema = z.object({
  query: z.any(),
  params: z.any(),
  body: z.object({
    version: z.string().trim().min(1, 'Terms version is required'),
    // Ids of the declarations the doctor ticked; the controller checks all are present.
    declarations: z.array(z.string()).min(1, 'Please tick every declaration to continue'),
  }),
});
