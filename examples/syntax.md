## CSS インライン属性

ブロック要素・インライン要素の後に波括弧を追加すると、インライン指定された CSS 属性として解釈されます。

参考: https://www.npmjs.com/package/markdown-it-attrs

- サンプル入力: 要素の末尾に追加

	<pre>
	# header {.style-me}
	paragraph {data-toggle=modal}
</pre>

- サンプル出力

	<pre>
	&lt;h1 class="style-me">header&lt;/h1&gt;
	&lt;p data-toggle="modal"&gt;paragraph&lt;/p&gt;
</pre>

- サンプル入力: インライン要素に追加

	<pre>
	paragraph *style me*{.red} more text
</pre>

- サンプル出力

	<pre>
	&lt;p&gt;paragraph &lt;em class="red"&gt;style me&lt;/em&gt; more text&lt;/p&gt;
</pre>

- サンプル入力: ブロック要素に追加

	<pre>
	```python {data=asdf}
	nums = [x for x in range(10)]
	```
</pre>

- サンプル出力

	<pre>
	&lt;pre&gt;&lt;code data="asdf" class="language-python"&gt;
	nums = [x for x in range(10)]
	&lt;/code&gt;&lt;/pre&gt;
</pre>

- サンプル入力: ブロック要素の直後に追加

	<pre>
	Use the css-module green on this paragraph.
	{.green}
</pre>

- サンプル出力

	<pre>
	&lt;p class="green"&gt;Use the css-module green on this paragraph.&lt;/p&gt;
</pre>

## ブロック要素のグループ化（フェンスされたブロック）

１つ以上のブロック要素をコロン３つのフェンスで括ると、グループ化して１つのブロック要素のように扱われます。

これだけでは見た目の変化はありませんが、「CSS インライン属性」と併用することができます。

参考: https://www.npmjs.com/package/markdown-it-div

- サンプル入力

	<pre>
	::: #warning
	*here be dragons*
	:::
</pre>

- サンプル出力

	<pre>
	&lt;div id="warning"&gt;
	&lt;em>here be dragons&lt;/em&gt;
	&lt;/div&gt;
</pre>

## 注釈

ハットに続くユニークな識別子を角括弧で括ると、注釈ブロックが自動生成されます。
注釈への参照には順番に番号が割り振られ、注釈文は注釈ブロックに順番に配置されます。

注釈ブロックは、各ページに配置（脚注）とならず、巻末に配置（後注）となります。

参考: https://www.npmjs.com/package/markdown-it-footnote-conventional

- サンプル入力: 脚注マーカーと注記を分けて追加

	<pre>
	Here is a footnote reference,[^1] and another.[^longnote]

	[^1]: Here is the footnote.

	[^longnote]: Here's one with multiple blocks.

		Subsequent paragraphs are indented to show that they
	belong to the previous footnote.

	This paragraph won’t be part of the note, because it
	isn’t indented.
</pre>

- サンプル出力

	<pre>
	&lt;p&gt;Here is a footnote reference,&lt;sup class="footnote-ref"&gt;&lt;a href="#fn1" id="fnref1"&gt;[1]&lt;/a&gt;&lt;/sup&gt; and another.&lt;sup class="footnote-ref"&gt;&lt;a href="#fn2" id="fnref2"&gt;[2]&lt;/a&gt;&lt;/sup&gt;&lt;/p&gt;
	&lt;section class="footnotes"&gt;
	&lt;ol class="footnotes-list"&gt;
	&lt;li value="1" id="fn1" class="footnote-item"&gt;&lt;p&gt;Here is the footnote.&lt;/p&gt;
	&lt;/li&gt;
	&lt;li value="2" id="fn2" class="footnote-item"&gt;&lt;p&gt;Here's one with multiple blocks.&lt;/p&gt;
	&lt;p&gt;Subsequent paragraphs are indented to show that they
	belong to the previous footnote.&lt;/p&gt;
	&lt;/li&gt;
	&lt;/ol&gt;
	&lt;/section&gt;
	&lt;p&gt;This paragraph won’t be part of the note, because it
	isn’t indented.&lt;/p&gt;
</pre>

## ハイパーリンク

角括弧と丸括弧を組み合わせると、ハイパーリンクとして解釈されます。

角括弧内はタイトルとして解釈されます。
省略した場合は ref クラスが付加されます。
ref クラスにスタイルを適用することで、リンク先タイトルを自動補完することができます。

ヘッダー（h1、h2、h3）にはアンカー（ユニークな id 名）が自動的に付加されますが、「CSS インライン属性」を使って別名を付加することもできます。
アンカーは URL エンコードされているため、ヘッダー別名は「アルファベット以外の文字を含むヘッダー」を参照したい時に有益です。

- サンプル入力: リンクを直に追加

	<pre>
	[Link](http://www.example.com)
</pre>

- サンプル出力

	<pre>
	&lt;p&gt;&lt;a href="http://www.example.com"&gt;Link&lt;/a&gt;&lt;/p&gt;
</pre>

- サンプル入力: リンクを別途追加

	<pre>
	[Link][example]
	
	[example]: http://www.example.com
</pre>

- サンプル出力

	<pre>
	&lt;p&gt;&lt;a href="http://www.example.com"&gt;Link&lt;/a&gt;&lt;/p&gt;
</pre>

- サンプル入力: ドキュメント内のハッシュリンクを追加

	<pre>
	[][example]
	
	## Good Example {data-alias=example}
</pre>

- サンプル出力

	<pre>
	&lt;p&gt;&lt;a href="#good-example"&gt;&lt;/a&gt;&lt;/p&gt;
	&lt;h2 id="#good-example" data-alias="example"&gt;Good Example&lt;/h2&gt;
</pre>

## ファイルの展開

「画像の展開」と同じ構文でタイトルに rel=content と指定すると、リンク先のテキストファイルが展開されます。
リンク先のテキストファイルから、さらにテキストファイルを展開することもできます。

参考: https://github.com/abechanta/markdown-it-include

- サンプル入力

	<pre>
	![rel=content](extension.md)
</pre>

- サンプルファイル extension.md

	```
	This is 1st item.
	
	This is 2nd item.
	```

- サンプル出力

	<pre>
	&lt;p&gt;This is 1st item.&lt;/p&gt;
	&lt;p&gt;This is 2nd item.&lt;/p&gt;
</pre>

## キーストローク

インライン要素を二重角括弧で括ると、キーストロークとして解釈されます。

参考: https://www.npmjs.com/package/markdown-it-kbd

- サンプル入力

	<pre>
	[[Ctrl]]+[[x]]
</pre>

- サンプル出力

	<pre>
	&lt;kbd&gt;Ctrl&lt;/kbd&gt;+&lt;kbd&gt;x&lt;/kbd&gt;
</pre>

## テーブル

同数のパイプを連続する複数の行に配置すると、テーブル（表）として解釈されます（一部は省略可能です）。
テーブルは「セル」「ヘッダー（表見出し）」「キャプション」から構成されます（一部は省略可能です）。

セルにはインライン要素を格納することができます。
行末にバックスラッシュを追加することで、複数行に渡るインライン要素も表現できます。
パイプを連続させることで、セルの横連結（セルスパン）を表現できます。
セルにハットを２つ配置すると、セルの縦連結（ロースパン）を表現できます。

参考: https://www.npmjs.com/package/markdown-it-multimd-table

参考: http://fletcher.github.io/MultiMarkdown-5/tables

- サンプル入力

	<pre>
	|             |          Grouping           ||
	First Header  | Second Header | Third Header |
	 ------------ | :-----------: | -----------: |
	Content       |          *Long Cell*        ||
	Content       |   **Cell**    |         Cell |
												  
	New section   |     More      |         Data |
	And more      | With an escaped '\\|'       ||
	[Prototype table]                             
</pre>

- サンプル出力

	<pre>
	&lt;table&gt;
		&lt;thead&gt;
			&lt;tr&gt;
				&lt;th&gt;&lt;/th&gt;
				&lt;th colspan="2"&gt;Grouping&lt;/th&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;th&gt;First Header&lt;/th&gt;
				&lt;th&gt;Second Header&lt;/th&gt;
				&lt;th&gt;Third Header&lt;/th&gt;
			&lt;/tr&gt;
		&lt;/thead&gt;
		&lt;tbody&gt;
			&lt;tr&gt;
				&lt;td&gt;Content&lt;/td&gt;
				&lt;td colspan="2"&gt;&lt;em&gt;Long Cell&lt;/em&gt;&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td&gt;Content&lt;/td&gt;
				&lt;td&gt;&lt;strong&gt;Cell&lt;/strong&gt;&lt;/td&gt;
				&lt;td&gt;Cell&lt;/td&gt;
			&lt;/tr&gt;
		&lt;/tbody&gt;
		&lt;tbody&gt;
			&lt;tr&gt;
				&lt;td&gt;New section&lt;/td&gt;
				&lt;td&gt;More&lt;/td&gt;
				&lt;td&gt;Data&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td&gt;And more&lt;/td&gt;
				&lt;td colspan="2"&gt;With an escaped '|'&lt;/td&gt;
			&lt;/tr&gt;
		&lt;/tbody&gt;
		&lt;caption&gt;Prototype table&lt;/caption&gt;
	&lt;/table&gt;
</pre>

- サンプル入力

	<pre>
	|   Markdown   | Rendered HTML |
	|--------------|---------------|
	|    *Italic*  | *Italic*      | \
	|              |               |
	|    - Item 1  | - Item 1      | \
	|    - Item 2  | - Item 2      |
	|    ```python | ```python       \
	|    .1 + .2   | .1 + .2         \
	|    ```       | ```           |
</pre>

- サンプル出力

	割愛

<!--

	<pre>
	&lt;table&gt;
		&lt;thead&gt;
			&lt;tr&gt;
				&lt;th&gt;Markdown&lt;/th&gt;
				&lt;th&gt;Rendered HTML&lt;/th&gt;
			&lt;/tr&gt;
		&lt;/thead&gt;
		&lt;tbody&gt;
			&lt;tr&gt;
				&lt;td&gt;
					&lt;pre&gt;&lt;code&gt;*Italic*
					&lt;/code&gt;&lt;/pre&gt;
				&lt;/td&gt;
				&lt;td&gt;
					&lt;p&gt;&lt;em&gt;Italic&lt;/em&gt;&lt;/p&gt;
				&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td&gt;
					&lt;pre&gt;&lt;code&gt;- Item 1
					- Item 2&lt;/code&gt;&lt;/pre&gt;
				&lt;/td&gt;
				&lt;td&gt;
					&lt;ul&gt;
					&lt;li&gt;Item 1&lt;/li&gt;
					&lt;li&gt;Item 2&lt;/li&gt;
					&lt;/ul&gt;
				&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td&gt;
					&lt;pre&gt;&lt;code&gt;```python
					.1 + .2
					```&lt;/code&gt;&lt;/pre&gt;
				&lt;/td&gt;
				&lt;td&gt;
					&lt;pre&gt;&lt;code&gt;.1 + .2
					&lt;/code&gt;&lt;/pre&gt;
				&lt;/td&gt;
			&lt;/tr&gt;
		&lt;/tbody&gt;
	&lt;/table&gt;
</pre>

-->

- サンプル入力

	<pre>
	Stage | Direct Products | ATP Yields
	----: | --------------: | ---------:
	Glycolysis | 2 ATP ||
	^^ | 2 NADH | 3--5 ATP |
	Pyruvaye oxidation | 2 NADH | 5 ATP |
	Citric acid cycle | 2 ATP ||
	^^ | 6 NADH | 15 ATP |
	^^ | 2 FADH2 | 3 ATP |
	**30--32** ATP |||
	[Net ATP yields per hexose]
</pre>

- サンプル出力

	割愛

<!--

	<pre>
	&lt;table&gt;
		&lt;caption&gt;Net ATP yields per hexose&lt;/caption&gt;
		&lt;thead&gt;
			&lt;tr&gt;
				&lt;th&gt;Stage&lt;/th&gt;
				&lt;th&gt;Direct Products&lt;/th&gt;
				&lt;th&gt;ATP Yields&lt;/th&gt;
			&lt;/tr&gt;
		&lt;/thead&gt;
		&lt;tbody&gt;
			&lt;tr&gt;
				&lt;td rowspan="2"&gt;Glycolysis&lt;/td&gt;
				&lt;td colspan="2"&gt;2 ATP&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td&gt;2 NADH&lt;/td&gt;
				&lt;td&gt;3–5 ATP&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td&gt;Pyruvaye oxidation&lt;/td&gt;
				&lt;td&gt;2 NADH&lt;/td&gt;
				&lt;td&gt;5 ATP&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td rowspan="3"&gt;Citric acid cycle&lt;/td&gt;
				&lt;td colspan="2"&gt;2 ATP&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td&gt;6 NADH&lt;/td&gt;
				&lt;td&gt;15 ATP&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td&gt;2 FADH2&lt;/td&gt;
				&lt;td&gt;3 ATP&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td colspan="3"&gt;&lt;strong&gt;30–32&lt;/strong&gt; ATP&lt;/td&gt;
			&lt;/tr&gt;
		&lt;/tbody&gt;
	&lt;/table&gt;
</pre>

-->

- サンプル入力

	<pre>
	|--|--|--|--|--|--|--|--|
	|♜|  |♝|♛|♚|♝|♞|♜|
	|  |♟|♟|♟|  |♟|♟|♟|
	|♟|  |♞|  |  |  |  |  |
	|  |♗|  |  |♟|  |  |  |
	|  |  |  |  |♙|  |  |  |
	|  |  |  |  |  |♘|  |  |
	|♙|♙|♙|♙|  |♙|♙|♙|
	|♖|♘|♗|♕|♔|  |  |♖|
</pre>

- サンプル出力

	割愛

<!--

	<pre>
	&lt;table&gt;
		&lt;tbody&gt;
			&lt;tr&gt;
				&lt;td&gt;♜&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;♝&lt;/td&gt;
				&lt;td&gt;♛&lt;/td&gt;
				&lt;td&gt;♚&lt;/td&gt;
				&lt;td&gt;♝&lt;/td&gt;
				&lt;td&gt;♞&lt;/td&gt;
				&lt;td&gt;♜&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;♟&lt;/td&gt;
				&lt;td&gt;♟&lt;/td&gt;
				&lt;td&gt;♟&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;♟&lt;/td&gt;
				&lt;td&gt;♟&lt;/td&gt;
				&lt;td&gt;♟&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td&gt;♟&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;♞&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;♗&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;♟&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;♙&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;♘&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td&gt;♙&lt;/td&gt;
				&lt;td&gt;♙&lt;/td&gt;
				&lt;td&gt;♙&lt;/td&gt;
				&lt;td&gt;♙&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;♙&lt;/td&gt;
				&lt;td&gt;♙&lt;/td&gt;
				&lt;td&gt;♙&lt;/td&gt;
			&lt;/tr&gt;
			&lt;tr&gt;
				&lt;td&gt;♖&lt;/td&gt;
				&lt;td&gt;♘&lt;/td&gt;
				&lt;td&gt;♗&lt;/td&gt;
				&lt;td&gt;♕&lt;/td&gt;
				&lt;td&gt;♔&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;&lt;/td&gt;
				&lt;td&gt;♖&lt;/td&gt;
			&lt;/tr&gt;
		&lt;/tbody&gt;
	&lt;/table&gt;
</pre>

-->

## ルビ

インライン要素を波括弧で括ると、ルビとして解釈されます。

参考: https://www.npmjs.com/package/markdown-it-ruby

- サンプル入力

	<pre>
	{ruby base|rubytext}
</pre>

- サンプル出力

	<pre>
	&lt;ruby&gt;ruby base&lt;rt&gt;ruby text&lt;/rt&gt;&lt;/ruby&gt;
</pre>

## 目次

ブロック要素として [toc] とだけ記述すると、目次ブロックが自動生成されます。
ドキュメント全体からヘッダー（h1、h2、h3）を抽出して、それぞれのヘッダーへのリンクが付加されます。
リンクにスタイルを適用することで、ページ番号を表示することができます。

個別のヘッダーに unnumbered クラスを付加することで、目次から除外することができます。
unnumbered クラスを付加するには「CSS インライン属性」を使います。

参考: https://www.npmjs.com/package/markdown-it-toc-done-right

- サンプル入力

	<pre>
	# markdown-it rulezz!
	
	[toc]
	## with markdown-it-toc-done-right rulezz even more!
</pre>

- サンプル出力（一部簡略）

	<pre>
	&lt;h1&gt;markdown-it rulezz!&lt;/h1&gt;
	&lt;nav class="table-of-contents"&gt;
		&lt;ol start="1"&gt;
			&lt;li data-item-num="1"&gt;
				&lt;a href="#markdown-it-rulezz-" title="#markdown-it-rulezz-"&gt;markdown-it rulezz!&lt;/a&gt;
				&lt;ol start="1"&gt;
					&lt;li data-item-num="1"&gt;
						&lt;a href="#with-markdown-it-toc-done-right-rulezz-even-more-" title="#with-markdown-it-toc-done-right-rulezz-even-more-"&gt;with markdown-it-toc-done-right rulezz even more!&lt;/a&gt;
					&lt;/li&gt;
				&lt;/ol&gt;
			&lt;/li&gt;
		&lt;/ol&gt;
	&lt;/nav&gt;
	&lt;h2&gt;with markdown-it-toc-done-right rulezz even more!&lt;/h2&gt;
</pre>

