"""
Author: Tinashe Kucherera
Date: 2026-04-16


Note: This file contains a utility for determing the right hardware given a model profile
      The idea is that when given a model profile we can determin the right hardware in terms of 
      CPU, GPU, RAM, DISK, and other hardware requiremments. It will also have helper functions
      for cloud providers and hardware types. This will be used by the hardware orchestrator to 
      make informed decisions about hardware allocation for different models and workloads.
"""

from __future__ import annotations

import logging
import json
import os

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "providers", "gcp"))

import dataclasses
import math 
from typing import Optional

from .providers.gcp.Instances import load_gcp_instances

logging.basicConfig(level=logging.INFO)


GCP_INSTANCES = load_gcp_instances()

@dataclasses.dataclass(frozen=True)
class InstanceSpec:
    provider:         str           # "gcp" | "aws" | "local"
    name:             str           # e.g. "a2-highgpu-1g"
    gpu_model:        Optional[str] # e.g. "A100-40G"
    gpu_count:        int           # 0 = CPU-only
    vram_gb:          float         # per-GPU VRAM (0 for CPU)
    total_vram_gb:    float         # gpu_count × vram_gb
    cpu_vcpus:        int
    ram_gb:           float
    gpu_memory_bw_gbs:float         # GPU memory bandwidth (GB/s); 0 for CPU
    tflops_fp16:      float         # peak FP16 TFLOPS; 0 for CPU
    price_per_hour:   float         # on-demand USD/hr  (0 for local)
    spot_price:       Optional[float]
    min_gpu_arch:     str           # "any" | "volta" | "ampere" | "ada"
    notes:            str = ""


# Full catalog — Yhis is for demonstration purposes only 
# In real implementation will keep a database of available instances and their specs, and update it regularly (e.g. via cloud provider APIs)
INSTANCE_CATALOG: list[InstanceSpec] = [
    *GCP_INSTANCES,
    #  Local / on-prem 
    InstanceSpec("local","local-cpu-only",    None,  0, 0,  0,  16, 32,   0,    0,    0.00, None,   "any",  "Generic workstation CPU"),
    InstanceSpec("local","local-rtx3090",     "RTX3090",1,24, 24, 12, 64,  936,  35.6, 0.00, None,   "ampere","Consumer GPU, no ECC"),
    InstanceSpec("local","local-rtx4090",     "RTX4090",1,24, 24, 16, 64, 1008,  82.6, 0.00, None,   "ada",   "Fastest consumer GPU"),
    InstanceSpec("local","local-a100-80g",    "A100-80G",1,80, 80, 32,128, 2000, 312,  0.00, None,   "ampere","Data-centre A100"),
 
   
    # AWS 
    # CPU-only 
    InstanceSpec("aws",  "m5.4xlarge",        None,  0, 0,  0, 16,  64,   0,    0,    0.77, 0.23,   "any",  "General-purpose CPU"),
 
    # T4 — g4dn family
    InstanceSpec("aws",  "g4dn.xlarge",       "T4",  1, 16, 16,  4,  16, 320,   65,   0.526,0.158,  "turing","Cheapest AWS GPU"),
    InstanceSpec("aws",  "g4dn.12xlarge",     "T4",  4, 16, 64, 48, 192, 320,   65,   3.912,1.174,  "turing","Quad T4"),
 
    # A10G — g5 family (Ada Lovelace, 24 GB)
    InstanceSpec("aws",  "g5.xlarge",         "A10G",1, 24, 24,  4,  16, 600,  125,   1.006,0.302,  "ampere","Similar to GCP L4"),
    InstanceSpec("aws",  "g5.12xlarge",       "A10G",4, 24, 96, 48, 192, 600,  125,   5.672,1.702,  "ampere","Quad A10G"),
    InstanceSpec("aws",  "g5.48xlarge",       "A10G",8, 24,192, 192,768, 600,  125,  16.288,4.886,  "ampere","8× A10G"),
 
    # A100 40 GB — p4d family
    InstanceSpec("aws",  "p4d.24xlarge",      "A100-40G",8,40,320, 96,1152,1555,  312,  32.77, 9.83,  "ampere","8× A100-40G, 400 Gbps NIC"),
 
    # A100 80 GB — p4de family
    InstanceSpec("aws",  "p4de.24xlarge",     "A100-80G",8,80,640, 96,1152,2000,  312,  40.96,12.29,  "ampere","8× A100-80G"),
 
    # H100 — p5 family
    InstanceSpec("aws",  "p5.48xlarge",       "H100-80G",8,80,640, 192,2048,3350,  989,  98.32, None,  "hopper","Fastest AWS GPU"),
 
    # Inferentia2 — cost-optimised inference only
    InstanceSpec("aws",  "inf2.xlarge",       "Inferentia2",1,32,32,4, 16,  820,  190,   0.76, 0.23,  "any",  "Requires torch-neuronx compile"),
    InstanceSpec("aws",  "inf2.8xlarge",      "Inferentia2",1,32,32,32,128,  820,  190,   1.97, 0.59,  "any",  "Requires torch-neuronx compile"),
]



@dataclasses.dataclass
class ScoredInstance:
    instance: InstanceSpec
    score: float
    vram_headroom: float # total_vram_gb - model_vram_gb
    cost_per_hour: float
    rejection_reason: Optional[str] = None 

    def summary(self) -> str:
        tag = f"[{self.instance.provider.upper()} {self.instance.name}]"
        gpu = self.instance.gpu_model or "CPU-only"
        spot = ""
        if self.instance.spot_price:
            spot = f" (spot: ${self.instance.spot_price:.2f}/hr)"
        return (
            f"{tag:6s} {self.instance.name:<22s}  "
            f"GPU: {gpu:<14s}  "
            f"VRAM: {self.instance.total_vram_gb:>4.0f} GB  "
            f"(+{self.vram_headroom:.0f} GB free)  "
            f"${self.cost_per_hour:.3f}/hr{spot}  "
            f"score={self.score:.3f}"
        )
    
@dataclasses.dataclass
class SelectionResult:
    profile_summary: str
    recommendation: Optional[ScoredInstance]
    alternatives: list[ScoredInstance] # best same provider 
    cross_cloud: list[ScoredInstance] # best from other provider this is here for when incoperating other providers future proof 
    rejected_count: int
    prefer: str

    def summary(self) -> str:
        lines = [
            "═" * 72,
            f"  Model profile : {self.profile_summary}",
            f"  Optimising for: {self.prefer}",
            "═" * 72,
            "",
            "  ★  RECOMMENDED",
            f"     {self.recommendation.summary()}",
            f"     └─ {self.recommendation.instance.notes}",
        ]
        if self.alternatives:
            lines += ["", "  ▸  ALTERNATIVES (same provider)"]
            for alt in self.alternatives:
                lines += [f"     {alt.summary()}"]
        if self.cross_cloud:
            lines += ["", "  ▸  CROSS-CLOUD OPTIONS"]
            for cc in self.cross_cloud:
                lines += [f"     {cc.summary()}"]
        lines += [
            "",
            f"  {self.rejected_count} instance(s) eliminated by hard filters.",
            "═" * 72,
        ]
        return "\n".join(lines)
    

# GPU architectures in order of increasing capability (for model compatibility checks)
_ARCH_ORDER = {"any": 0, "turing": 1, "ampere": 2, "ada": 3, "hopper": 4}
 
def _arch_meets_requirement(instance_arch: str, required_arch: str) -> bool:
    """True if instance GPU arch is >= required arch."""
    return _ARCH_ORDER.get(instance_arch, 0) >= _ARCH_ORDER.get(required_arch, 0)



# Hardware filtering and scoring logic
def _hardware_filter(
        spec: InstanceSpec,
        vram_gb: float,
        flags: set[str],
        providers: list[str]) -> Optional[str]:
      """
      Return a rejection reason string, or None if the instance passes 

      """
      # Provider filter 
      if spec.provider not in providers:
          return "provider_not_requested"
      
      # VRAM filter
      if spec.total_vram_gb < vram_gb * 1.10: # give 10% headroom
          return (
              f"insufficient_vram "
              f"({spec.total_vram_gb:.0f} GB < {vram_gb:.0f} GB + headroom)"
          )
      
      # gpu requirement filter
      if "requires_gpu" in flags and spec.gpu_count == 0:
          return "requires_gpu_but_no_gpu"
      
      # Ampere requirement filter
      if "requires_ampere" in flags and not _arch_meets_requirement(spec.min_gpu_arch, "ampere"):
        return f"requires_ampere_gpu (instance has {spec.min_gpu_arch})"
 
      # Nvidia required (custom CUDA kernels)
      if "requires_nvidia" in flags and spec.gpu_model and "inferentia" in spec.gpu_model.lower():
            return "requires_nvidia_cuda_kernel (Inferentia is not NVIDIA)"
      
      # Inferentia requires explicit opt-in flag
      if spec.gpu_model and "inferentia" in spec.gpu_model.lower():
            if "allow_inferentia" not in flags:
                  return "inferentia_requires_explicit_opt_in"
      
      return None  # passed

def _effective_bandwidth(spec_bw, vram_needed):
    # Small models don't benefit from huge bandwidth
    saturation_point = 1000  # GB/s (roughly A100 level)
    return min(spec_bw, saturation_point)


def _score(
        spec: InstanceSpec,
        vram_needed: float,
        compute_class: str,
        prefer: str,      # "cost" | "performance" | "balanced"
        use_spot: bool
):
      """
      Returns a scalar score ∈ (0, ∞) — higher is better.
      
      Three sub-scores are blended:
            • vram_fit      — prefer instances that are snug (not wildly over-provisioned)
            • throughput    — higher memory bandwidth or TFLOPS depending on compute class
            • cost          — lower cost per hour is better
      """
      effective_price = (spec.spot_price if use_spot and spec.spot_price else spec.price_per_hour)
      if effective_price == 0:
            effective_price = 0.001          # local VM: tiny positive so scoring still works
      
      #  VRAM fit score
      headroom_ratio = spec.total_vram_gb / max(vram_needed, 0.5)
      # Sweet spot: 1.1× – 2.5× required VRAM.  Penalise both under and over.
      if headroom_ratio < 1.1:
            vram_score = 0.01                # should be filtered out already
      elif headroom_ratio <= 2.5:
            vram_score = 1.0
      else:
            # Over-provisioned: gentle logarithmic penalty
            vram_score = (2.5 / headroom_ratio)
      
      # Throughput score 
      if compute_class == "memory_bw_bound":
            # LLM token generation — bottleneck is HBM bandwidth
            throughput_score = _effective_bandwidth(spec.gpu_memory_bw_gbs, vram_needed) / 1000.0  # normalise ~A100 = 1.0
      elif compute_class == "compute_bound":
            # CNNs — bottleneck is TFLOPS
            throughput_score = spec.tflops_fp16 / 312.0         # normalise ~A100 = 1.0
      elif compute_class == "cpu_viable":
            # Small models — throughput matters less; prefer cost
            throughput_score = 0.5 if spec.gpu_count == 0 else 0.8
      else:
            throughput_score = spec.tflops_fp16 / 312.0
      
      # Cost score 
      # Invert price so cheap = high score; cap at 20 to avoid divide-by-near-zero
      cost_score = min(1.0 / effective_price, 20.0) / 20.0
      
      # Blend weights by preference


      weights = {
            "cost":     (0.15, 0.25, 0.60),   # (vram, throughput, cost)
            "latency":  (0.20, 0.60, 0.20),
            "balanced": (0.20, 0.40, 0.40),
      }


      wv, wt, wc = weights.get(prefer, weights["balanced"])
      
      if vram_needed < 2:
            if prefer == "balanced":
                  wv, wt, wc = (0.25, 0.25, 0.50)
            elif prefer == "latency":
                  wv, wt, wc = (0.20, 0.50, 0.30)
            elif prefer == "cost":
                  wv, wt, wc = (0.20, 0.20, 0.60)
                    

      base_score = wv * vram_score + wt * throughput_score + wc * cost_score
    
      # penalize multi-GPU instances for small models (diminishing returns, more things can go wrong)
      if spec.gpu_count > 1:
            multi_gpu_penalty = 1 / spec.gpu_count
      else:
            multi_gpu_penalty = 1.0

      return base_score * multi_gpu_penalty


class HardwareSelector:
      """
      Maps a HardwareProfile → ranked machine recommendations.
      
      Parameters
      ----------
      providers   : which clouds to consider  (default: all)
      use_spot    : price with spot/preemptible discount where available
      prefer      : "cost" | "latency" | "balanced"
      allow_inferentia : include AWS Inferentia2 (requires torch-neuronx compile step)
      catalog     : override the built-in INSTANCE_CATALOG for testing
      """
 
      def __init__(
            self,
            providers:         list[str] | None  = None,
            use_spot:          bool               = False,
            prefer:            str                = "balanced",
            allow_inferentia:  bool               = False,
            catalog:           list[InstanceSpec] | None = None,
      ):
            self.providers        = providers or ["gcp", "aws", "local"]
            self.use_spot         = use_spot
            self.prefer           = prefer
            self.allow_inferentia = allow_inferentia
            self.catalog          = catalog or INSTANCE_CATALOG

      def select(self, profile, prefer: str | None = None) -> SelectionResult:
            """
            Accept a HardwareProfile (from model_profiler.py) and return a
            SelectionResult with a ranked recommendation.
            """
            prefer = prefer or self.prefer
      
            flags = set(profile.compat_flags)
            if self.allow_inferentia:
                  flags.add("allow_inferentia")
      
            vram_needed   = profile.vram_needed_gb
            compute_class = profile.compute_class
      
            # Score every instance 
            scored: list[ScoredInstance] = []
            rejected_count = 0
      
            for spec in self.catalog:
                  rejection = _hardware_filter(spec, vram_needed, flags, self.providers)
                  if rejection:
                        rejected_count += 1
                        scored.append(ScoredInstance(
                              instance      = spec,
                              score         = -1,
                              vram_headroom = spec.total_vram_gb - vram_needed,
                              cost_per_hour = spec.price_per_hour,
                              rejection_reason     = rejection,
                        ))
                        continue
      
                  s = _score(spec, vram_needed, compute_class, prefer, self.use_spot)
                  effective_price = (
                  spec.spot_price if self.use_spot and spec.spot_price
                  else spec.price_per_hour
                  )
                  scored.append(ScoredInstance(
                  instance      = spec,
                  score         = s,
                  vram_headroom = spec.total_vram_gb - vram_needed,
                  cost_per_hour = effective_price,
                  rejection_reason     = None,
                  ))
      
            # Sort passing candidates
            passing = sorted(
                  [s for s in scored if s.rejection_reason is None],
                  key=lambda x: x.score,
                  reverse=True,
            )
      
            if not passing:
                  raise RuntimeError(
                  f"No instance in the catalog fits this model "
                  f"(VRAM needed: {vram_needed:.1f} GB, flags: {flags}). "
                  "Consider adding a larger instance or enabling quantization."
                  )
      
            top = passing[0]
            top_provider = top.instance.provider
      
            # Alternatives: same provider, next 2 best
            alternatives = [
                  s for s in passing[1:]
                  if s.instance.provider == top_provider
            ][:2]
      
            # Cross-cloud: best from each other provider
            seen_providers = {top_provider}
            cross_cloud: list[ScoredInstance] = []
            for s in passing[1:]:
                  if s.instance.provider not in seen_providers:
                        cross_cloud.append(s)
                        seen_providers.add(s.instance.provider)
      
            return SelectionResult(
                  profile_summary = profile.summary(),
                  recommendation  = top,
                  alternatives    = alternatives,
                  cross_cloud     = cross_cloud,
                  rejected_count  = rejected_count,
                  prefer          = prefer,
            )
 
      # Convenience helpers
 
      def select_for_providers(
            self,
            profile,
            providers: list[str],
            prefer: str = "balanced",
      ) -> dict[str, ScoredInstance]:
            """Return the top pick per provider as a dict."""
            results: dict[str, ScoredInstance] = {}
            for provider in providers:
                  selector = HardwareSelector(
                  providers        = [provider],
                  use_spot         = self.use_spot,
                  prefer           = prefer,
                  allow_inferentia = self.allow_inferentia,
                  catalog          = self.catalog,
                  )
                  try:
                        result = selector.select(profile, prefer=prefer)
                        results[provider] = result.recommendation
                  except RuntimeError as exc:
                        results[provider] = None  # type: ignore[assignment]
            return results
      
      def cheapest(self, profile) -> ScoredInstance:
            return self.select(profile, prefer="cost").recommendation
      
      def fastest(self, profile) -> ScoredInstance:
            return self.select(profile, prefer="latency").recommendation
 
 

# Deployment config generator

 
def generate_deploy_config(scored: ScoredInstance, profile) -> dict:
    """
    Emit a provider-specific deployment config dict that orchestrator
    (Terraform, gcloud CLI, boto3, etc.) can consume directly.
    """
    spec = scored.instance
    base = {
        "provider":      spec.provider,
        "instance_type": spec.name,
        "gpu_model":     spec.gpu_model,
        "gpu_count":     spec.gpu_count,
        "vram_gb":       spec.total_vram_gb,
        "estimated_cost_per_hour": scored.cost_per_hour,
    }
 
    if spec.provider == "gcp":
        base.update({
            "gcp_machine_type":    spec.name,
            "gcp_accelerator_type": _gcp_accelerator_type(spec.gpu_model),
            "gcp_accelerator_count": spec.gpu_count,
            "gcp_disk_size_gb":    200,
            "gcp_image_family":    "pytorch-latest-gpu-debian-11-py310",
            "gcp_preemptible":     scored.cost_per_hour == spec.spot_price,
            "startup_script":      _gcp_startup_script(profile, spec),
        })
 
    elif spec.provider == "aws":
        base.update({
            "aws_instance_type":   spec.name,
            "aws_ami":             "ami-0abcdef1234567890",  # replace with your AMI
            "aws_spot":            scored.cost_per_hour == spec.spot_price,
            "aws_ebs_volume_gb":   200,
            "user_data":           _aws_user_data(profile, spec),
        })
 
    elif spec.provider == "local":
        base.update({
            "docker_image":        "pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime",
            "docker_run_flags":    _local_docker_flags(spec),
            "compose_snippet":     _local_compose(profile, spec),
        })
 
    return base
 
 
def _gcp_accelerator_type(gpu_model: Optional[str]) -> Optional[str]:
    mapping = {
        "T4":       "nvidia-tesla-t4",
        "L4":       "nvidia-l4",
        "A100-40G": "nvidia-tesla-a100",
        "A100-80G": "nvidia-a100-80gb",
        "H100-80G": "nvidia-h100-80gb",
    }
    return mapping.get(gpu_model or "", None)
 
 
def _gcp_startup_script(profile, spec: InstanceSpec) -> str:
    dtype_flag = "--dtype float16" if profile.dtype in ("float16", "bfloat16") else ""
    return f"""#!/bin/bash
set -e
pip install vllm transformers accelerate
python -m vllm.entrypoints.openai.api_server \\
    --model {getattr(profile, 'model_name', 'your-model')} \\
    {dtype_flag} \\
    --tensor-parallel-size {spec.gpu_count} \\
    --gpu-memory-utilization 0.90 \\
    --port 8000
"""
 
 
def _aws_user_data(profile, spec: InstanceSpec) -> str:
    return f"""#!/bin/bash
set -e
pip install vllm
python -m vllm.entrypoints.openai.api_server \\
    --model {getattr(profile, 'model_name', 'your-model')} \\
    --tensor-parallel-size {spec.gpu_count} \\
    --port 8000
"""
 
 
def _local_docker_flags(spec: InstanceSpec) -> str:
    if spec.gpu_count > 0:
        return "--gpus all --ipc=host --ulimit memlock=-1"
    return "--cpus 4 --memory 16g"
 
 
def _local_compose(profile, spec: InstanceSpec) -> str:
    gpu_section = (
        "\n    deploy:\n"
        "      resources:\n"
        "        reservations:\n"
        "          devices:\n"
        "            - driver: nvidia\n"
        "              count: all\n"
        "              capabilities: [gpu]"
    ) if spec.gpu_count > 0 else ""
 
    return f"""version: "3.9"
services:
  model-server:
    image: pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime
    ports:
      - "8000:8000"
    volumes:
      - ./models:/models{gpu_section}
    command: >
      python -m vllm.entrypoints.openai.api_server
      --model /models/{getattr(profile, 'model_name', 'your-model')}
      --tensor-parallel-size {spec.gpu_count or 1}
      --port 8000
"""
 
 

# CLI / quick test

 
if __name__ == "__main__":
    import sys, json
 
    # ── Demo: synthesise a profile (or import from model_profiler.py) ─────
    try:
        from model_profiler import create_profiler
        model_path = sys.argv[1] if len(sys.argv) > 1 else \
            "/home/tinashe/Desktop/projects/sabhuku_ai/backend/hardware_orch/test_models/distilgpt2/"
        profile = create_profiler(model_path).get_profile()
    except Exception as exc:
        print(f"[warn] Could not load real model ({exc}), using synthetic profile.")
 
        # Synthetic 7B decoder-only fp16 profile for demo
        from model_profiler import HardwareProfile
        profile = HardwareProfile(
            parameter_count      = 7_000_000_000,
            vram_needed_gb       = 14.0,
            dtype                = "float16",
            bytes_per_param      = 2.0,
            architecture_family  = "transformer",
            architecture_subtype = "decoder_only",
            compute_class        = "memory_bw_bound",
            estimated_flops      = 2 * 7_000_000_000 * 2048,
            max_sequence_length  = 4096,
            hidden_size          = 4096,
            num_layers           = 32,
            compat_flags         = {"requires_gpu"},
        )
 
    print("\n── Balanced recommendation (GCP preferred) ──")
    selector = HardwareSelector(providers=["gcp", "aws", "local"], prefer="balanced")
    result   = selector.select(profile)
    print(result.summary())
 
    print("\n── Deployment config for top pick ──")
    config = generate_deploy_config(result.recommendation, profile)
    print(json.dumps(config, indent=2))
 
    print("\n── Cost-optimised per-provider comparison ──")
    per_provider = selector.select_for_providers(
        profile,
        providers=["gcp", "aws", "local"],
        prefer="cost",
    )
    for provider, pick in per_provider.items():
        if pick:
            print(f"  {provider.upper():6s} → {pick.summary()}")
        else:
            print(f"  {provider.upper():6s} → no suitable instance found")





