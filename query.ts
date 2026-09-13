import { db } from './src/db';
import { users } from './src/db/schema';
db.select().from(users).then(res => { console.log(res); process.exit(0); });
