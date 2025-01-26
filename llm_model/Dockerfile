FROM nvidia/cuda:12.6.3-cudnn-runtime-ubuntu24.04

WORKDIR /QuickNotes/llm_model

RUN apt-get update && \
    apt-get install -y --no-install-recommends wget git && \
    apt-get install -y build-essential && \
    wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh && \
    bash Miniconda3-latest-Linux-x86_64.sh -b -p /opt/conda && \
    rm -f Miniconda3-latest-Linux-x86_64.sh && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV PATH="/opt/conda/bin:$PATH"

COPY ./requirements.txt ./

RUN conda update -n base -c defaults conda && \
    conda create -y -n quicknotes python=3.10 && \
    conda clean --all -f -y

RUN echo "source activate quicknotes" > ~/.bashrc
ENV PATH /opt/conda/envs/quicknotes/bin:$PATH

RUN conda install -n quicknotes pytorch torchvision torchaudio pytorch-cuda=12.4 -c pytorch -c nvidia && \
conda run -n quicknotes pip install PyMuPDF && \
conda run -n quicknotes pip install packaging && \
conda run -n quicknotes pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git" && \
conda run -n quicknotes pip install --no-cache-dir -r requirements.txt

COPY ./llm_multi_model.py ./
COPY ./document_processing.py ./
COPY ./fact_checking_pipeline.py ./
COPY ./rag.py ./
COPY ./prompts.py ./
COPY ./main.py ./
COPY ./temp ./

EXPOSE 8000

CMD ["conda", "run", "--no-capture-output", "-n", "quicknotes", "python", "main.py"]