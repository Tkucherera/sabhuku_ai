import json
import re
from os import path
from typing import Optional

WORK_DIR = path.join(path.dirname(__file__))

PROVIDER = "gcp"

class GCPInstance:
    provider = PROVIDER
    name:             str           
    gpu_model:        Optional[str]
    gpu_count:        int          
    vram_gb:          float         
    total_vram_gb:    float         
    cpu_vcpus:        int
    ram_gb:           float
    gpu_memory_bw_gbs:float        
    tflops_fp16:      float         
    price_per_hour:   float        
    spot_price:      float
    min_gpu_arch:     str          
    notes:            str = ""

    def __init__(self):
        self.name = ""
        self.gpu_model = None
        self.gpu_count = 0
        self.vram_gb = 0.0
        self.total_vram_gb = 0.0
        self.cpu_vcpus = 0
        self.ram_gb = 0.0
        self.gpu_memory_bw_gbs = 0.0
        self.tflops_fp16 = 0.0
        self.price_per_hour = 0.0
        self.spot_price = 0.0
        self.min_gpu_arch = ""
        self.notes = ""

    def update_ram_gb(self):
        """
        There is no clear vram value so will try to pull it from description
        """
        pass

    
def get_instances_from_file(file_path) -> list:
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data

def load_gcp_instances() -> list:
    file_path = path.join(WORK_DIR, 'gcp.json')
    instances = get_instances_from_file(file_path)
    gcp_instances = []
    for instance in instances:
        gcp_instance = GCPInstance()
        gcp_instance.name = instance.get('name')
        gcp_instance.gpu_model = instance['accelerators'][0].get("guestAcceleratorType", None) if instance.get('accelerators') else None
        gcp_instance.gpu_count = instance['accelerators'][0].get("guestAcceleratorCount", 0) if instance.get('accelerators') else 0
        gcp_instance.vram_gb = instance.get('vram_gb', 40.0)
        gcp_instance.total_vram_gb = instance.get('total_vram_gb', 40.0 * gcp_instance.gpu_count)
        gcp_instance.cpu_vcpus = instance.get('guestCpus', 0)
        gcp_instance.ram_gb = instance.get('memoryMb', 0.0) / 1024.0
        gcp_instance.gpu_memory_bw_gbs = instance.get('gpu_memory_bw_gbs', 0.0)
        gcp_instance.tflops_fp16 = instance.get('tflops_fp16', 0.0)
        gcp_instance.price_per_hour = instance.get('price_per_hour', 0.0)
        gcp_instance.spot_price = instance.get('spot_price', 0.0)
        gcp_instance.min_gpu_arch = instance.get('architecture', '')
        gcp_instance.notes = instance.get('description', '')
        
        gcp_instances.append(gcp_instance)
    

    return gcp_instances