<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArsipResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'nomorBerkas'      => $this->nomor_berkas,
            'bulan'            => $this->bulan,
            'tanggal'          => $this->tanggal?->format('Y-m-d'),
            'kodeTransaksiId'  => $this->kode_transaksi_id,
            'sumberDanaId'     => $this->sumber_dana_id,
            'arsipKegiatanId'  => $this->arsip_kegiatan_id,
            'akunId'           => $this->akun_id,
            'metodePengadaanId' => $this->metode_pengadaan_id,
            'penerimaDana'     => $this->penerima_dana,
            'uraianKegiatan'   => $this->uraian_kegiatan,
            'jumlahBruto'      => (float) $this->jumlah_bruto,
            'potongan'         => (float) $this->potongan,
            'jumlahNetto'      => (float) $this->jumlah_netto,
            'ppk'              => $this->ppk,
            'fileName'         => $this->file_name,
            'fileSize'         => $this->file_size,
            'fileMime'         => $this->file_mime,
            'hasFile'          => !empty($this->file_path),
            'statusVerifikasi' => $this->status_verifikasi,
            'verifiedAt'       => $this->verified_at?->format('Y-m-d H:i'),
            'createdBy'        => $this->created_by,
            'updatedBy'        => $this->updated_by,
            'updated'          => $this->updated_at?->format('Y-m-d H:i'),
            'kodeTransaksi'    => $this->whenLoaded('kodeTransaksi', fn () => new KodeTransaksiResource($this->kodeTransaksi)),
            'sumberDana'       => $this->whenLoaded('sumberDana', fn () => new SumberDanaResource($this->sumberDana)),
            'arsipKegiatan'    => $this->whenLoaded('arsipKegiatan', fn () => new ArsipKegiatanResource($this->arsipKegiatan)),
            'akun'             => $this->whenLoaded('akun', fn () => new AkunResource($this->akun)),
            'metodePengadaan'  => $this->whenLoaded('metodePengadaan', fn () => new MetodePengadaanResource($this->metodePengadaan)),
            'verifier'         => $this->whenLoaded('verifier', fn () => [
                'id'   => $this->verifier->id,
                'name' => $this->verifier->name,
            ]),
            'creator'          => $this->whenLoaded('creator', fn () => [
                'id'   => $this->creator->id,
                'name' => $this->creator->name,
            ]),
        ];
    }
}
