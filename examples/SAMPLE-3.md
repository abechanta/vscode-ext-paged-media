# スプライト描画クラス

## まずは雛形から

DirectX 12において、描画はそれなりに複雑な作業です。こういった場合、複雑な作業をカプセル化して、簡単に扱えるようにしておきたいものです。そこで、スプライトの描画はクラスとして実装することにします。
 `Sprite`構造体定義の下に、次のコードを追加してください。

```
/**
 \* スプライト描画クラス.
 */
 class SpriteRenderer
 {
 public:
   SpriteRenderer();
   ~SpriteRenderer() = default;
 private:
 };
```



## メンバ変数

このクラスにはどんなメンバ変数が必要でしょうか。まずはコマンドリストに関連する変数が必要ですね。

また、スプライトは長方形なので、一枚ごとに4つの頂点データが必要になります。一枚一枚が3Dゲームのように大量の頂点を持つわけではないため、事前に頂点データを準備して再利用する、というのはあまり効率的ではないように思えます。そこで、毎フレーム、全てのスプライトの頂点データを頂点バッファに詰め込んでいくことにします。描画中の頂点バッファを書き換えるのはまずいので、頂点バッファもフレームバッファと同じ数だけ用意することにします。
 頂点データが変化しても、インデックスは常に0から順番に振られます。そのため、インデックスバッファは最初に作ったものを使いまわすことができます。

これらを踏まえて`private`メンバに追加するメンバ変数は以下のとおりです。

```
struct FrameResource
 {
   Microsoft::WRL::ComPtr<ID3D12CommandAllocator> commandAllocator;
   Microsoft::WRL::ComPtr<ID3D12Resource> vertexBuffer;
   D3D12_VERTEX_BUFFER_VIEW vertexBufferView;
   void* vertexBufferGPUAddress;
 };
 std::vector<FrameResource> frameResourceList;
 Microsoft::WRL::ComPtr<ID3D12GraphicsCommandList> commandList;
 Microsoft::WRL::ComPtr<ID3D12Resource> indexBuffer;
 D3D12_INDEX_BUFFER_VIEW indexBufferView;
 size_t maxSpriteCount;
```

今回は`FrameResource`という構造体を作り、フレームバッファごとに必要な変数を格納することにしました。
 さらに、変数宣言に必要なヘッダファイルのインクルードも追加しましょう。

`DirectXMath.h`のインクルード文の下に、次のコードを追加してくだだい。

```
#include <d3d12.h>
#include <wrl/client.h>
#include <vector>
```

## メンバ関数

次はパブリックメンバ関数について考えていきます。

まずは、コマンドリストや頂点バッファといったデータを初期化する機能が必要です。初期化関数はD3Dデバイスインターフェイス、フレームバッファの数、最大スプライト数(頂点バッファのサイズを決定するため)を受け取ることになるでしょう。そうすると、初期化関数宣言は次のようになります。

```
bool Init(
   Microsoft::WRL::ComPtr<ID3D12Device> device,
   int numFrameBuffer,
   int maxSprite);
```

このクラスはスプライトを描画するものなので、少なくとも描画関数が必要です。描画関数は、スプライトのリストを受け取り、それを頂点データに変換して頂点バッファに格納します。そして、コマンドリストに描画コマンドを追加します。ということは、描画コマンドのための様々なパラメータも引数で受け取ることになります。
 これらを考慮した描画関数宣言が次のコードです。

```
bool Draw(
   const std::vector<Sprite>& spriteList,
   const PSO& pso,
   const Texture& texture,
   int frameIndex,
   RenderingInfo& info);
```

スプライトを描画するには、スプライト用の`PSO`とコマンドリストにグラフィックスパイプラインの状態を設定してあげる必要があります。設定項目が多いので、`RenderingInfo`という型にまとめることにしましょう。また、この関数は`PSO`と`Texutre`の参照を使っているので、これらの先行宣言も加えておきましょう。
 `wrl/client.h`のインクルード文のあとに次のコードを追加します。

```
struct Texture;
struct PSO;
```

さて、`Draw`関数でコマンドリストしたら、それを取り出してコマンドキューに渡すことができなければなりません。
 これは特に引数を取る必要はないので、次のような関数宣言になります。

```
ID3D12GraphicsCommandList* GetCommandList();
```

値を取得するだけの関数の場合、`const`を付与することが一般的です。しかし、コマンドリストを渡す先である`ID3D12CommandQueue:: ExecuteCommandLists`関数が非`const`なポインタを要求しているため、この関数宣言にも`const`を付与していません。

## RenderingInfo構造体

`Draw`関数で使う描画情報をまとめた構造体を定義します。
 `Sprite`構造体定義の下に、次のコードを追加してください。

```
/**
 \* スプライト描画情報.
 */
struct RenderingInfo
{
    D3D12_CPU_DESCRIPTOR_HANDLE rtvHandle; ///< スプライト描画先レンダーターゲット.
    D3D12_CPU_DESCRIPTOR_HANDLE dsvHandle; ///< スプライト描画先深度バッファ.
    D3D12_VIEWPORT viewport; ///< 描画用ビューポート.
    D3D12_RECT scissorRect; ///< 描画用シザリング矩形.
    ID3D12DescriptorHeap* texDescHeap; ///< テクスチャ用のデスクリプタヒープ.
    DirectX::XMFLOAT4X4 matViewProjection; ///< 描画に使用する座標変換行列.
};
```

`Draw`関数の全ての引数をこの構造体に入れてもいいのですが、例えば複数の`SpriteRenderer`を使い、それぞれに異なる`PSO`やテクスチャを割り当てたいと考えるのはありうることです。そこで、そのようなパラメータは単独で引数としておき、その他の変更されにくいパラメータだけを含めることにしました。

