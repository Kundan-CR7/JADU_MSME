
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Sales Data...');

    // 1. Get Items
    const items = await prisma.item.findMany();
    if (items.length === 0) {
        console.error('❌ No items found. Please create inventory items first.');
        return;
    }

    // 2. Clear old sales (optional, but good for clean slate if needed. Let's KEEP distinct to avoid foreign key hell for now, just ADD new ones)
    // Actually, to make graphs look good, adding is fine.

    const salesToCreate = [];
    const now = new Date();

    // Generate 50 transactions
    for (let i = 0; i < 50; i++) {
        // Random Date in last 6 months
        const date = new Date(now);
        date.setDate(date.getDate() - Math.floor(Math.random() * 180));

        // Random Items (1-5 items per order)
        const numItems = Math.floor(Math.random() * 4) + 1;
        const orderItems = [];
        let totalAmount = 0;

        for (let j = 0; j < numItems; j++) {
            const item = items[Math.floor(Math.random() * items.length)];
            const quantity = Math.floor(Math.random() * 5) + 1;
            const price = Number(item.sellingPrice);

            orderItems.push({
                itemId: item.id,
                quantity,
                unitPrice: price,
                // We skip batchIdUsed for historical seed simplicity unless strictly enforced
            });
            totalAmount += (quantity * price);
        }

        const invoiceId = `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000)}`;

        // Create Sale
        const sale = prisma.sale.create({
            data: {
                invoiceId,
                customerName: ['John Doe', 'Jane Smith', 'AutoRepair Locos', 'Mike Ross', 'Harvey Specter'][Math.floor(Math.random() * 5)],
                totalAmount,
                createdAt: date,
                items: {
                    create: orderItems
                }
            }
        });

        salesToCreate.push(sale);

        // Create Processed Record
        salesToCreate.push(prisma.processedInvoice.create({
            data: {
                invoiceId,
                processedAt: date
            }
        }));
    }

    await prisma.$transaction(salesToCreate);

    console.log(`✅ Successfully seeded ${salesToCreate.length / 2} sales records.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
