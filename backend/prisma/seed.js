const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // 1. Categories
    const categoriesData = [
        { name: 'Groceries', description: 'Daily staples like Rice, Flour, Pulses, Oil' },
        { name: 'Snacks & Beverages', description: 'Chips, Biscuits, Cold Drinks, Juices' },
        { name: 'Personal Care', description: 'Soaps, Shampoos, Toothpaste' },
        { name: 'Household', description: 'Detergents, Cleaners, Disinfectants' }
    ];

    const categories = {};
    for (const cat of categoriesData) {
        const record = await prisma.category.upsert({
            where: { id: cat.name }, // Using name as ID logic sort of, but here we query by findFirst ideally or just create. But since ID is UUID, ensure we don't duplicate. We'll search by Name logic manually or just createMany (if empty).
            // Since schema doesn't force Name unique, we'll try to find first.
            update: {},
            create: { name: cat.name, description: cat.description },
        });
        // Find properly since upsert needs unique where
        const existing = await prisma.category.findFirst({ where: { name: cat.name } });
        if (!existing) {
            categories[cat.name] = await prisma.category.create({ data: cat });
        } else {
            categories[cat.name] = existing;
        }
    }

    // 2. Suppliers
    const suppliersData = [
        { name: 'Metro Cash & Carry', contactInfo: 'metro@business.com | 1800-METRO', reliabilityScore: 0.95, avgDeliveryTimeDays: 2 },
        { name: 'Local Mandi Distributor', contactInfo: 'rajesh.traders@local.com | 9876543210', reliabilityScore: 0.85, avgDeliveryTimeDays: 1 }
    ];

    const suppliers = {};
    for (const sup of suppliersData) {
        const existing = await prisma.supplier.findFirst({ where: { name: sup.name } });
        if (!existing) {
            suppliers[sup.name] = await prisma.supplier.create({ data: sup });
        } else {
            suppliers[sup.name] = existing;
        }
    }

    // 3. Items
    const itemsData = [
        // Groceries
        { code: 'GR-RIC-001', name: 'India Gate Basmati Rice (5kg)', category: 'Groceries', costPrice: 450, sellingPrice: 650, reorderPoint: 20 },
        { code: 'GR-RIC-002', name: 'Daawat Rozana Rice (5kg)', category: 'Groceries', costPrice: 350, sellingPrice: 480, reorderPoint: 15 },
        { code: 'GR-ATT-001', name: 'Aashirvaad Shudh Chakki Atta (10kg)', category: 'Groceries', costPrice: 380, sellingPrice: 480, reorderPoint: 15 },
        { code: 'GR-ATT-002', name: 'Fortune Chakki Fresh Atta (5kg)', category: 'Groceries', costPrice: 190, sellingPrice: 240, reorderPoint: 10 },
        { code: 'GR-OIL-001', name: 'Fortune Soyabean Oil (1L)', category: 'Groceries', costPrice: 110, sellingPrice: 145, reorderPoint: 30 },
        { code: 'GR-OIL-002', name: 'Saffola Gold Edible Oil (5L)', category: 'Groceries', costPrice: 850, sellingPrice: 1100, reorderPoint: 5 },
        { code: 'GR-OIL-003', name: 'Dhara Mustard Oil (1L)', category: 'Groceries', costPrice: 130, sellingPrice: 160, reorderPoint: 20 },
        { code: 'GR-SUG-001', name: 'Madhur Pure Sugar (1kg)', category: 'Groceries', costPrice: 42, sellingPrice: 55, reorderPoint: 25 },
        { code: 'GR-SUG-002', name: 'Organic Brown Sugar (500g)', category: 'Groceries', costPrice: 60, sellingPrice: 85, reorderPoint: 10 },
        { code: 'GR-DAL-001', name: 'Tata Sampann Toor Dal (1kg)', category: 'Groceries', costPrice: 130, sellingPrice: 175, reorderPoint: 20 },
        { code: 'GR-DAL-002', name: 'Tata Sampann Moong Dal (500g)', category: 'Groceries', costPrice: 60, sellingPrice: 80, reorderPoint: 15 },
        { code: 'GR-DAL-003', name: 'Chana Dal Loose (1kg)', category: 'Groceries', costPrice: 70, sellingPrice: 90, reorderPoint: 20 },
        { code: 'GR-SPI-001', name: 'Everest Turmeric Powder (200g)', category: 'Groceries', costPrice: 50, sellingPrice: 68, reorderPoint: 20 },
        { code: 'GR-SPI-002', name: 'Everest Red Chilli Powder (200g)', category: 'Groceries', costPrice: 65, sellingPrice: 85, reorderPoint: 20 },
        { code: 'GR-SPI-003', name: 'MDH Garam Masala (100g)', category: 'Groceries', costPrice: 75, sellingPrice: 98, reorderPoint: 25 },
        { code: 'GR-SAL-001', name: 'Tata Salt (1kg)', category: 'Groceries', costPrice: 20, sellingPrice: 28, reorderPoint: 50 },
        { code: 'GR-GHE-001', name: 'Amul Pure Ghee (1L)', category: 'Groceries', costPrice: 550, sellingPrice: 680, reorderPoint: 10 },

        // Snacks & Beverages
        { code: 'SN-LAY-001', name: 'Lays Magic Masala (Rs.20)', category: 'Snacks & Beverages', costPrice: 16, sellingPrice: 20, reorderPoint: 50 },
        { code: 'SN-LAY-002', name: 'Lays American Cream & Onion (Rs.20)', category: 'Snacks & Beverages', costPrice: 16, sellingPrice: 20, reorderPoint: 50 },
        { code: 'SN-KUR-001', name: 'Kurkure Masala Munch (Rs.20)', category: 'Snacks & Beverages', costPrice: 16, sellingPrice: 20, reorderPoint: 40 },
        { code: 'SN-MAG-001', name: 'Maggi 2-Minute Noodles (280g)', category: 'Snacks & Beverages', costPrice: 38, sellingPrice: 48, reorderPoint: 40 },
        { code: 'SN-MAG-002', name: 'Maggi Atta Noodles (300g)', category: 'Snacks & Beverages', costPrice: 45, sellingPrice: 58, reorderPoint: 20 },
        { code: 'SN-BIS-001', name: 'Britannia Good Day Cashew (200g)', category: 'Snacks & Beverages', costPrice: 30, sellingPrice: 40, reorderPoint: 30 },
        { code: 'SN-BIS-002', name: 'Parle-G Gold (1kg)', category: 'Snacks & Beverages', costPrice: 110, sellingPrice: 140, reorderPoint: 15 },
        { code: 'SN-BIS-003', name: 'Oreo Original Cookies (120g)', category: 'Snacks & Beverages', costPrice: 25, sellingPrice: 35, reorderPoint: 25 },
        { code: 'SN-COC-001', name: 'Coca Cola (750ml)', category: 'Snacks & Beverages', costPrice: 32, sellingPrice: 40, reorderPoint: 24 },
        { code: 'SN-PEP-001', name: 'Pepsi (750ml)', category: 'Snacks & Beverages', costPrice: 32, sellingPrice: 40, reorderPoint: 24 },
        { code: 'SN-SPR-001', name: 'Sprite (750ml)', category: 'Snacks & Beverages', costPrice: 32, sellingPrice: 40, reorderPoint: 20 },
        { code: 'SN-FRU-001', name: 'Tropicana Mixed Fruit Juice (1L)', category: 'Snacks & Beverages', costPrice: 90, sellingPrice: 120, reorderPoint: 12 },
        { code: 'SN-DAI-001', name: 'Cadbury Dairy Milk Silk (60g)', category: 'Snacks & Beverages', costPrice: 65, sellingPrice: 80, reorderPoint: 30 },
        { code: 'SN-KIT-001', name: 'Nestle KitKat (4 Finger)', category: 'Snacks & Beverages', costPrice: 20, sellingPrice: 30, reorderPoint: 30 },
        { code: 'SN-TEA-001', name: 'Red Label Tea (500g)', category: 'Snacks & Beverages', costPrice: 220, sellingPrice: 280, reorderPoint: 15 },
        { code: 'SN-COF-001', name: 'Nescafe Classic Coffee (50g)', category: 'Snacks & Beverages', costPrice: 140, sellingPrice: 175, reorderPoint: 20 },

        // Personal Care
        { code: 'PC-DOV-001', name: 'Dove Beauty Bar (3x100g)', category: 'Personal Care', costPrice: 160, sellingPrice: 215, reorderPoint: 15 },
        { code: 'PC-LUX-001', name: 'Lux Rose Soap (3x100g)', category: 'Personal Care', costPrice: 110, sellingPrice: 140, reorderPoint: 20 },
        { code: 'PC-DET-001', name: 'Dettol Original Soap (125g)', category: 'Personal Care', costPrice: 45, sellingPrice: 58, reorderPoint: 25 },
        { code: 'PC-COL-001', name: 'Colgate Strong Teeth Toothpaste (200g)', category: 'Personal Care', costPrice: 85, sellingPrice: 110, reorderPoint: 20 },
        { code: 'PC-SEN-001', name: 'Sensodyne Fresh Mint (70g)', category: 'Personal Care', costPrice: 110, sellingPrice: 145, reorderPoint: 10 },
        { code: 'PC-SHA-001', name: 'Sunsilk Black Shine Shampoo (650ml)', category: 'Personal Care', costPrice: 320, sellingPrice: 450, reorderPoint: 8 },
        { code: 'PC-SHA-002', name: 'Head & Shoulders Anti-Dandruff (180ml)', category: 'Personal Care', costPrice: 150, sellingPrice: 190, reorderPoint: 12 },
        { code: 'PC-FAC-001', name: 'Himalaya Purifying Neem Face Wash (100ml)', category: 'Personal Care', costPrice: 120, sellingPrice: 150, reorderPoint: 15 },
        { code: 'PC-HAI-001', name: 'Parachute Coconut Oil (500ml)', category: 'Personal Care', costPrice: 160, sellingPrice: 195, reorderPoint: 15 },
        { code: 'PC-DEO-001', name: 'Fogg Scent Impressio (100ml)', category: 'Personal Care', costPrice: 180, sellingPrice: 220, reorderPoint: 10 },
        { code: 'PC-SAN-001', name: 'Dettol Hand Sanitizer (200ml)', category: 'Personal Care', costPrice: 80, sellingPrice: 100, reorderPoint: 10 },

        // Household
        { code: 'HH-SUR-001', name: 'Surf Excel Matic Liquid (1L)', category: 'Household', costPrice: 190, sellingPrice: 240, reorderPoint: 10 },
        { code: 'HH-ARI-001', name: 'Ariel Matic Powder (2kg)', category: 'Household', costPrice: 380, sellingPrice: 490, reorderPoint: 8 },
        { code: 'HH-VIM-001', name: 'Vim Dishwash Bar (300g)', category: 'Household', costPrice: 20, sellingPrice: 30, reorderPoint: 30 },
        { code: 'HH-LIZ-001', name: 'Lizol Floor Cleaner Citrus (2L)', category: 'Household', costPrice: 310, sellingPrice: 390, reorderPoint: 10 },
        { code: 'HH-HAR-001', name: 'Harpic Toilet Cleaner (1L)', category: 'Household', costPrice: 160, sellingPrice: 198, reorderPoint: 12 },
        { code: 'HH-DOM-001', name: 'Domex Disinfectant (500ml)', category: 'Household', costPrice: 85, sellingPrice: 110, reorderPoint: 15 },
        { code: 'HH-MOS-001', name: 'All Out Ultra Refill (Pack of 2)', category: 'Household', costPrice: 130, sellingPrice: 160, reorderPoint: 15 },
        { code: 'HH-TIS-001', name: 'Origami Face Tissues (Pack of 3)', category: 'Household', costPrice: 140, sellingPrice: 180, reorderPoint: 10 },
        { code: 'HH-BAT-001', name: 'Duracell AA Batteries (4 Pack)', category: 'Household', costPrice: 150, sellingPrice: 190, reorderPoint: 20 },
        { code: 'HH-SCR-001', name: 'Scotch-Brite Scrub Pad (Large)', category: 'Household', costPrice: 25, sellingPrice: 35, reorderPoint: 30 }
    ];

    for (const item of itemsData) {
        const categoryId = categories[item.category]?.id;
        if (!categoryId) continue;

        const existing = await prisma.item.findUnique({ where: { code: item.code } });
        if (!existing) {
            const newItem = await prisma.item.create({
                data: {
                    code: item.code,
                    name: item.name,
                    description: item.name, // Simple desc
                    categoryId: categoryId,
                    costPrice: item.costPrice,
                    sellingPrice: item.sellingPrice,
                    reorderPoint: item.reorderPoint,
                    isActive: true
                }
            });

            console.log(`Created item: ${item.name}`);

            // 4. Initial Stock (Inventory Batch + Transaction)
            // Add random stock between reorderPoint * 2 and reorderPoint * 5
            const quantity = item.reorderPoint * 3;

            const batch = await prisma.inventoryBatch.create({
                data: {
                    itemId: newItem.id,
                    batchNumber: `BATCH-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
                    quantity: quantity,
                    receivedDate: new Date(),
                    // Approx 6 months expiry for food, 2 years for others
                    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6))
                }
            });

            await prisma.inventoryTransaction.create({
                data: {
                    itemId: newItem.id,
                    batchId: batch.id,
                    changeType: 'PURCHASE', // Initial stock as purchase
                    quantityChange: quantity,
                    referenceId: 'INITIAL-LOAD'
                }
            });

            // 5. Link to Suppliers (create SupplierItem)
            // Randomly assign to a supplier
            const supplierName = Math.random() > 0.5 ? 'Metro Cash & Carry' : 'Local Mandi Distributor';
            const supplierId = suppliers[supplierName]?.id;

            if (supplierId) {
                await prisma.supplierItem.create({
                    data: {
                        supplierId: supplierId,
                        itemId: newItem.id,
                        price: item.costPrice, // Just assume supplier price = cost price
                        leadTimeDays: Math.floor(Math.random() * 3) + 1
                    }
                });
            }
        } else {
            console.log(`Item already exists: ${item.name}`);
        }
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
