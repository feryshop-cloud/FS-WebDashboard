import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('Starting seed process...')

  try {
// 1. CLEANUP
  console.log('Cleaning up existing data...')
  await supabase.from('finance_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('deals').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('stocks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('games').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 2. SEED GAMES
  console.log('Seeding Games...')
  const gameCategories = [
    { name: 'Mobile Legends', slug: 'mobile-legends' },
    { name: 'Free Fire', slug: 'free-fire' },
    { name: 'Roblox', slug: 'roblox' },
    { name: 'PUBG Mobile', slug: 'pubg-mobile' },
    { name: 'Genshin Impact', slug: 'genshin-impact' },
    { name: 'Valorant', slug: 'valorant' },
    { name: 'Lainnya', slug: 'lainnya' },
  ]

  const { error: gamesError } = await supabase.from('games').insert(
    gameCategories.map(cat => ({
      name: cat.name,
      slug: cat.slug,
    }))
  )

  if (gamesError) throw gamesError

  // Fetch seeded games for inventory references
  const { data: allGames } = await supabase.from('games').select('id, name').order('name')

  // 3. SEED INVENTORY
  console.log('Seeding Inventory...')
  const gameMap: Record<string, string> = {}
  if (allGames) {
    for (const g of allGames) {
      gameMap[g.name] = g.id
    }
  }

  const { error: inventoryError } = await supabase.from('inventory').insert([
    { game_id: gameMap['Mobile Legends'], title_reference: 'MLBB Mythic Glory 120 Skins', account_specs: 'Login Moonton/VK. Winrate 65%.', capital_price: 800000, asking_price: 1500000, status: 'AVAILABLE', added_by: null },
    { game_id: gameMap['Valorant'], title_reference: 'Valorant Ascendant 3 - Kuronami Bundle', account_specs: 'Riot Games Login. Asia Pacific.', capital_price: 1200000, asking_price: 2000000, status: 'AVAILABLE', added_by: null },
    { game_id: gameMap['Genshin Impact'], title_reference: 'Genshin AR 60 - 20 C6 5-Stars', account_specs: 'Hoyoverse Login. Asia Server. All map 100%.', capital_price: 2500000, asking_price: 4000000, status: 'AVAILABLE', added_by: null },
    { game_id: gameMap['PUBG Mobile'], title_reference: 'PUBG Conqueror S19 - Glacier M416 Max', account_specs: 'Twitter Login. Global version.', capital_price: 1500000, asking_price: 2500000, status: 'AVAILABLE', added_by: null },
    { game_id: gameMap['Free Fire'], title_reference: 'FF Sultan Old Account - Elite Pass S1-S5', account_specs: 'VK Login. Indo Server.', capital_price: 600000, asking_price: 1000000, status: 'AVAILABLE', added_by: null },
  ])

  if (inventoryError) throw inventoryError

  // 4. SEED ACCOUNTS
    console.log('Seeding Accounts...')
    const { data: accounts, error: accountsError } = await supabase.from('accounts').insert([
      { name: 'QRIS Ferryshop', account_number: 'QRIS-001', balance: 15000000 },
      { name: 'Seabank', account_number: '9012345678', balance: 5000000 },
      { name: 'Bank Jago', account_number: '1029384756', balance: 2500000 },
      { name: 'DANA', account_number: '081234567891', balance: 1000000 },
      { name: 'OVO', account_number: '081234567892', balance: 1500000 },
      { name: 'GoPay', account_number: '081234567893', balance: 2000000 },
      { name: 'Mandiri', account_number: '142001234567', balance: 10000000 }
    ]).select()

    if (accountsError) throw accountsError
    const qrisAccount = accounts.find(a => a.name === 'QRIS Ferryshop')!
    const seabankAccount = accounts.find(a => a.name === 'Seabank')!

    // Seed initial balance to ledger for accounts to match their balance
    for (const acc of accounts) {
      await supabase.from('finance_ledger').insert({
        account_id: acc.id,
        transaction_type: 'ADJUSTMENT',
        amount: acc.balance,
        description: `Initial balance for ${acc.name}`
      })
    }

    // 3. SEED STOCKS
    console.log('Seeding Stocks...')
    const { data: stocks, error: stocksError } = await supabase.from('stocks').insert([
      { category: 'Mobile Legends', name: 'MLBB Mythic Glory 120 Skins (Zodiac+Legend)', username: 'admin_mlbb', password: 'mlbbpassword', account_details: 'Login Moonton/VK. Winrate 65%.', capital_price: 800000, post_price: 1500000, current_price: 1500000, status: 'AVAILABLE', purchase_payment_status: 'LUNAS', images: ['https://picsum.photos/seed/ml1/800/600', 'https://picsum.photos/seed/ml2/800/600', 'https://picsum.photos/seed/ml3/800/600', 'https://picsum.photos/seed/ml4/800/600', 'https://picsum.photos/seed/ml5/800/600'] },
      { category: 'Valorant', name: 'Valorant Ascendant 3 - Kuronami Bundle', username: 'valo_admin', password: 'valopassword', account_details: 'Riot Games Login. Asia Pacific.', capital_price: 1200000, post_price: 2000000, current_price: 2000000, status: 'AVAILABLE', purchase_payment_status: 'LUNAS', images: ['https://picsum.photos/seed/val1/800/600', 'https://picsum.photos/seed/val2/800/600', 'https://picsum.photos/seed/val3/800/600'] },
      { category: 'Genshin Impact', name: 'Genshin AR 60 - 20 C6 5-Stars', username: 'genshin_admin', password: 'genshinpassword', account_details: 'Hoyoverse Login. Asia Server. All map 100%.', capital_price: 2500000, post_price: 4000000, current_price: 4000000, status: 'AVAILABLE', purchase_payment_status: 'LUNAS', images: ['https://picsum.photos/seed/gi1/800/600', 'https://picsum.photos/seed/gi2/800/600', 'https://picsum.photos/seed/gi3/800/600', 'https://picsum.photos/seed/gi4/800/600'] },
      { category: 'PUBG Mobile', name: 'PUBG Conqueror S19 - Glacier M416 Max', username: 'pubg_admin', password: 'pubgpassword', account_details: 'Twitter Login. Global version.', capital_price: 1500000, post_price: 2500000, current_price: 2500000, status: 'AVAILABLE', purchase_payment_status: 'LUNAS', images: ['https://picsum.photos/seed/pubg1/800/600', 'https://picsum.photos/seed/pubg2/800/600'] },
      { category: 'Free Fire', name: 'FF Sultan Old Account - Elite Pass S1-S5', username: 'ff_admin', password: 'ffpassword', account_details: 'VK Login. Indo Server.', capital_price: 600000, post_price: 1000000, current_price: 1000000, status: 'AVAILABLE', purchase_payment_status: 'LUNAS', images: ['https://picsum.photos/seed/ff1/800/600', 'https://picsum.photos/seed/ff2/800/600', 'https://picsum.photos/seed/ff3/800/600'] }
    ]).select()

    if (stocksError) throw stocksError

    const mlbbStock = stocks[0]
    const valoStock = stocks[1]
    const genshinStock = stocks[2]

    // 4. SEED TRANSACTIONS
    console.log('Seeding Transactions...')

    // Deal 1: Lunas (MLBB)
    const { data: deal1, error: deal1Err } = await supabase.from('deals').insert({
      deal_number: `DEAL-${Date.now()}-1`,
      stock_id: mlbbStock.id,
      customer_name: 'Budi Santoso',
      customer_contact: '081234567890',
      deal_price: 1400000, // Sold for 1.4m (negotiated from 1.5m)
      remaining_balance: 1400000,
      status: 'DRAFT'
    }).select().single()
    if (deal1Err) throw deal1Err

    await supabase.rpc('process_payment', {
      p_deal_id: deal1.id,
      p_account_id: qrisAccount.id,
      p_amount: 1400000,
      p_notes: 'Lunas via QRIS',
      p_admin_id: null
    })

    // Deal 2: Lunas (Valorant)
    const { data: deal2, error: deal2Err } = await supabase.from('deals').insert({
      deal_number: `DEAL-${Date.now()}-2`,
      stock_id: valoStock.id,
      customer_name: 'Jessica Wong',
      customer_contact: '089876543210',
      deal_price: 2000000,
      remaining_balance: 2000000,
      status: 'DRAFT'
    }).select().single()
    if (deal2Err) throw deal2Err

    await supabase.rpc('process_payment', {
      p_deal_id: deal2.id,
      p_account_id: seabankAccount.id,
      p_amount: 2000000,
      p_notes: 'Transfer Seabank Lunas',
      p_admin_id: null
    })

    // Deal 3: Booking/DP (Genshin)
    const { data: deal3, error: deal3Err } = await supabase.from('deals').insert({
      deal_number: `DEAL-${Date.now()}-3`,
      stock_id: genshinStock.id,
      customer_name: 'Anton Wijaya',
      customer_contact: 'anton@email.com',
      deal_price: 3800000,
      remaining_balance: 3800000,
      status: 'DRAFT'
    }).select().single()
    if (deal3Err) throw deal3Err

    await supabase.rpc('process_payment', {
      p_deal_id: deal3.id,
      p_account_id: qrisAccount.id,
      p_amount: 1000000, // DP of 1m
      p_notes: 'DP 1 Juta',
      p_admin_id: null
    })

    console.log('Database successfully seeded with realistic data!')

  } catch (err) {
    console.error('Seeding error:', err)
  }
}

main()
