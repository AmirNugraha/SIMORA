<?php

namespace App\Services;

use App\Models\Kegiatan;
use Illuminate\Support\Facades\DB;

class KegiatanService
{
    /**
     * Create a new kegiatan with its nested komponen rows.
     */
    public function create(array $data): Kegiatan
    {
        return DB::transaction(function () use ($data) {
            $kegiatan = Kegiatan::create($this->extractKegiatanData($data));
            $this->syncKomponen($kegiatan, $data['komponen'] ?? []);

            return $kegiatan->load(['komponens' => fn ($q) => $q->orderBy('id'),
                'komponens.logs' => fn ($q) => $q->orderByDesc('tanggal')]);
        });
    }

    /**
     * Update an existing kegiatan and sync its komponen rows.
     * Existing logs are preserved; removed komponens are cascade-deleted.
     */
    public function update(Kegiatan $kegiatan, array $data): Kegiatan
    {
        return DB::transaction(function () use ($kegiatan, $data) {
            $kegiatan->update($this->extractKegiatanData($data));
            $this->syncKomponen($kegiatan, $data['komponen'] ?? []);

            return $kegiatan->fresh(['komponens' => fn ($q) => $q->orderBy('id'),
                'komponens.logs' => fn ($q) => $q->orderByDesc('tanggal')]);
        });
    }

    /**
     * Sync the komponen list for a kegiatan:
     * - Deletes rows not present in the incoming list (cascade deletes their logs).
     * - Updates existing rows (preserving their logs).
     * - Inserts new rows.
     */
    private function syncKomponen(Kegiatan $kegiatan, array $items): void
    {
        // Collect real DB IDs that belong to this kegiatan
        $existingIds = $kegiatan->komponens()->pluck('id')->all();

        // Only keep numeric IDs that actually exist in DB for this kegiatan
        $incomingIds = collect($items)
            ->pluck('id')
            ->filter(fn ($id) => is_numeric($id) && in_array((int) $id, $existingIds))
            ->values()
            ->all();

        // Delete komponens no longer in the incoming list (cascade deletes their logs)
        $kegiatan->komponens()->whereNotIn('id', $incomingIds)->delete();

        foreach ($items as $item) {
            $kompData = [
                'kode_akun' => $item['kode_akun'],
                'nama'      => $item['nama'],
                'pagu'      => (float) $item['pagu'],
            ];

            // Only update if ID is numeric and actually belongs to this kegiatan
            if (!empty($item['id']) && is_numeric($item['id']) && in_array((int) $item['id'], $existingIds)) {
                $kegiatan->komponens()->where('id', $item['id'])->update($kompData);
            } else {
                $kegiatan->komponens()->create($kompData);
            }
        }
    }

    /**
     * Extract only the kegiatan-level fields from the validated payload.
     */
    private function extractKegiatanData(array $data): array
    {
        return [
            'kategori'      => $data['kategori'],
            'kode'          => $data['kode'],
            'kegiatan'      => $data['kegiatan'],
            'pagu'          => (float) $data['pagu'],
            'blokir'        => (float) ($data['blokir'] ?? 0),
            'progres_fisik' => $data['progres_fisik'] ?? 0,
            'ket'           => $data['ket'] ?? null,
            'belanja'       => $data['belanja'],
            'akun'          => $data['akun'] ?? null,
            'sumber_dana'   => $data['sumber_dana'],
        ];
    }
}
