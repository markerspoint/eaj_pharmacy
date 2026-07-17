<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Roles:
     *   super_admin   — no branch, bypasses all access checks, full system
     *   administrator — full branch admin (products, users, orders, reports)
     *   manager       — approves expenses & petty cash, verifies cash counts
     *   cashier       — POS only: sales, cash session, cash count, petty cash requests
     */
    public function run(): void
    {
        $cmc  = Branch::where('code', 'CMC')->first();
        $can  = Branch::where('code', 'CAN')->first();
        $abc1 = Branch::where('code', 'ABC1')->first();
        $xyz1 = Branch::where('code', 'XYZ1')->first();

        $users = [

            // ── Super Admin ────────────────────────────────────────
            [
                'fname'     => 'System',
                'lname'     => 'Administrator',
                'username'  => 'superadmin',
                'password'  => Hash::make('superadmin123'),
                'role'      => User::ROLE_SUPER_ADMIN,
                'branch_id' => null,
                'access'    => [],
            ],

            // ── Administrators ─────────────────────────────────────
            [
                'fname'     => 'Admin',
                'lname'     => 'COOP Main',
                'username'  => 'admin.coop.main',
                'password'  => Hash::make('admin123'),
                'role'      => User::ROLE_ADMINISTRATOR,
                'branch_id' => $cmc?->id,
                'access'    => [],
            ],
            [
                'fname'     => 'Admin',
                'lname'     => 'COOP Annex',
                'username'  => 'admin.coop.annex',
                'password'  => Hash::make('admin123'),
                'role'      => User::ROLE_ADMINISTRATOR,
                'branch_id' => $can?->id,
                'access'    => [],
            ],
            [
                'fname'     => 'Admin',
                'lname'     => 'ABC Store',
                'username'  => 'admin.abc',
                'password'  => Hash::make('admin123'),
                'role'      => User::ROLE_ADMINISTRATOR,
                'branch_id' => $abc1?->id,
                'access'    => [],
            ],
            [
                'fname'     => 'Admin',
                'lname'     => 'XYZ Warehouse',
                'username'  => 'admin.xyz',
                'password'  => Hash::make('admin123'),
                'role'      => User::ROLE_ADMINISTRATOR,
                'branch_id' => $xyz1?->id,
                'access'    => [],
            ],

            // ── Managers ───────────────────────────────────────────
            [
                'fname'     => 'Ana',
                'lname'     => 'Rivera',
                'username'  => 'ana.manager',
                'password'  => Hash::make('manager123'),
                'role'      => User::ROLE_MANAGER,
                'branch_id' => $cmc?->id,
                'access'    => [],
            ],
            [
                'fname'     => 'Ben',
                'lname'     => 'Torres',
                'username'  => 'ben.manager',
                'password'  => Hash::make('manager123'),
                'role'      => User::ROLE_MANAGER,
                'branch_id' => $can?->id,
                'access'    => [],
            ],
            [
                'fname'     => 'Maria',
                'lname'     => 'Santos',
                'username'  => 'maria.manager',
                'password'  => Hash::make('manager123'),
                'role'      => User::ROLE_MANAGER,
                'branch_id' => $abc1?->id,
                'access'    => [],
            ],
            [
                'fname'     => 'Pedro',
                'lname'     => 'Reyes',
                'username'  => 'pedro.manager',
                'password'  => Hash::make('manager123'),
                'role'      => User::ROLE_MANAGER,
                'branch_id' => $xyz1?->id,
                'access'    => [],
            ],

            // ── Cashiers ───────────────────────────────────────────
            // CMC has 2 cashiers — busy dine-in cafe
            [
                'fname'     => 'Carlo',
                'lname'     => 'Mendoza',
                'username'  => 'carlo.cashier',
                'password'  => Hash::make('cashier123'),
                'role'      => User::ROLE_CASHIER,
                'branch_id' => $cmc?->id,
                'access'    => [],
            ],
            [
                'fname'     => 'Diana',
                'lname'     => 'Cruz',
                'username'  => 'diana.cashier',
                'password'  => Hash::make('cashier123'),
                'role'      => User::ROLE_CASHIER,
                'branch_id' => $cmc?->id,
                'access'    => [],
            ],
            [
                'fname'     => 'Ella',
                'lname'     => 'Bautista',
                'username'  => 'ella.cashier',
                'password'  => Hash::make('cashier123'),
                'role'      => User::ROLE_CASHIER,
                'branch_id' => $can?->id,
                'access'    => [],
            ],
            [
                'fname'     => 'Frank',
                'lname'     => 'Lim',
                'username'  => 'frank.cashier',
                'password'  => Hash::make('cashier123'),
                'role'      => User::ROLE_CASHIER,
                'branch_id' => $abc1?->id,
                'access'    => [],
            ],
            [
                'fname'     => 'Grace',
                'lname'     => 'Tan',
                'username'  => 'grace.cashier',
                'password'  => Hash::make('cashier123'),
                'role'      => User::ROLE_CASHIER,
                'branch_id' => $xyz1?->id,
                'access'    => [],
            ],
        ];

        foreach ($users as $data) {
            if (empty($data['access'])) {
                if ($data['role'] === User::ROLE_ADMINISTRATOR) {
                    $data['access'] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '26', '27', '29', '30', '31', '32', '33', '34', '35', '36', '37'];
                } elseif ($data['role'] === User::ROLE_MANAGER) {
                    $data['access'] = ['1', '2', '3', '4', '5', '14', '15', '16', '17', '18', '19', '20', '21', '26', '27', '29', '30', '31', '32', '33', '34', '35', '36', '37'];
                } elseif ($data['role'] === User::ROLE_CASHIER) {
                    $data['access'] = ['2', '3', '4', '5', '14', '15', '16', '17', '29', '32'];
                }
            }
            User::updateOrCreate(['username' => $data['username']], $data);
        }

        $this->command->info('✓ Users seeded (' . count($users) . ')');
    }
}
