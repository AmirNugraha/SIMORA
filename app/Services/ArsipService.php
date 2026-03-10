<?php

namespace App\Services;

use App\Models\Arsip;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ArsipService
{
    public function create(array $data, ?UploadedFile $file, ?int $userId): Arsip
    {
        return DB::transaction(function () use ($data, $file, $userId) {
            $data['created_by'] = $userId;
            $data['updated_by'] = $userId;

            if ($file) {
                $data = array_merge($data, $this->storeFile($file));
            }

            $arsip = Arsip::create($data);

            return $arsip->load([
                'kodeTransaksi', 'sumberDana', 'arsipKegiatan',
                'akun', 'metodePengadaan', 'creator',
            ]);
        });
    }

    public function update(Arsip $arsip, array $data, ?UploadedFile $file, ?int $userId): Arsip
    {
        return DB::transaction(function () use ($arsip, $data, $file, $userId) {
            $data['updated_by'] = $userId;

            if ($file) {
                $this->deleteFile($arsip);
                $data = array_merge($data, $this->storeFile($file));
            }

            $arsip->update($data);

            return $arsip->fresh([
                'kodeTransaksi', 'sumberDana', 'arsipKegiatan',
                'akun', 'metodePengadaan', 'creator',
            ]);
        });
    }

    public function delete(Arsip $arsip): void
    {
        $arsip->delete(); // Soft delete — file preserved
    }

    private function storeFile(UploadedFile $file): array
    {
        $year  = now()->format('Y');
        $month = now()->format('m');
        $path  = $file->store("arsip_scans/{$year}/{$month}", 'local');

        return [
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'file_mime' => $file->getMimeType(),
        ];
    }

    public function deleteFile(Arsip $arsip): void
    {
        if ($arsip->file_path && Storage::disk('local')->exists($arsip->file_path)) {
            Storage::disk('local')->delete($arsip->file_path);
        }
    }
}
