import { z } from 'zod';

const emailSchema = z.string().email();

const emails = [
    'phone+967777777777@local',
    'phone+123456@local',
    'test@example.com'
];

emails.forEach(e => {
    const result = emailSchema.safeParse(e);
    console.log(`Email: ${e}, Valid: ${result.success}`);
    if (!result.success) {
        console.log(result.error);
    }
});
