<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@bpdas-barito.go.id'],
            [
                'name'     => 'Administrator',
                'password' => Hash::make('password'),
                'role'     => 'admin',
            ]
        );

        User::firstOrCreate(
            ['email' => 'operator@bpdas-barito.go.id'],
            [
                'name'     => 'Operator SIMORA',
                'password' => Hash::make('password'),
                'role'     => 'operator',
            ]
        );
    }
}
