
import { db } from '@repo/db';
import { signJwt } from '../src/utils/jwt';

async function main() {
    const email = 'test_verifier@jeeey.com';

    console.log('Creating/Updating test user...');
    try {
        const user = await db.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                password: 'hashed_placeholder', // We won't login via password
                name: 'Test Verifier',
                role: 'USER',
                isVerified: true,
                phone: '770000000'
            }
        });

        console.log('User ID:', user.id);

        const token = signJwt({
            userId: user.id,
            email: user.email,
            role: user.role,
            phone: user.phone || undefined
        });

        console.log('---TOKEN_START---');
        console.log(token);
        console.log('---TOKEN_END---');
    } catch (e) {
        console.error('Error creating user:', e);
        process.exit(1);
    }
}

main().catch(console.error).finally(() => process.exit(0));
