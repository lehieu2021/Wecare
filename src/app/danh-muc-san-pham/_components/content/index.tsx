import { match } from "assert";
import { createClient } from "@lib/supabase/server";

import { Tables } from "~/lib/supabase/types";
import { getLeafNode } from "../../utils";
import { LeafCarousel } from "../leaf-carousel";
import { PriceTable } from "./PriceTable";

export const Content = async ({
  params,
}: {
  params: { level1Slug?: string; level2Slug?: string };
}) => {
  const supabase = createClient();
  const childNodes = await getLeafNode(
    params.level1Slug ?? params.level2Slug ?? "",
  );

  const priceTablesQuery = await Promise.all(
    childNodes.map((node) => {
      return supabase
        .from("products")
        .select("*")
        .eq("product_group_id", node.id!)
        .order("id", { ascending: true });
    }),
  );

  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  return (
    <div className="p-4">
      {params.level1Slug}
      {childNodes.map((node, index) => {
        return (
          <div>
            {index}
            {node.id}
            {node.name}
          </div>
        );
      })}
      {priceTablesQuery.map((query, index) => {
        const products = query.data ?? [];
        const groupedByChatLieu: Record<string, Tables<"products">[]> = {};
        products.forEach((product) => {
          const { chat_lieu } = product;
          const chatLieu = chat_lieu ?? "unknown";
          if (!groupedByChatLieu[chatLieu]) {
            groupedByChatLieu[chatLieu] = [];
          }
          groupedByChatLieu[chatLieu]!.push(product);
        });

        const prices = products.map((i) => i.gia ?? 0);
        const priceMin = Math.min(...prices);
        const priceMax = Math.max(...prices);
        return (
          <div
            key={childNodes[index]!.id}
            className="mb-4 rounded-lg bg-white p-4"
          >
            <div className="flex gap-4 pb-4 text-xs leading-4 text-gray-800 bg-blend-normal max-md:flex-wrap">
              <img
                loading="lazy"
                srcSet={
                  childNodes[index]!.image_url ||
                  "https://placehold.co/600x400/png"
                }
                className="aspect-square h-[120px] w-[120px] shrink-0"
              />
              <div className="">
                <p className="text-sx cursor-pointer pb-1 text-blue-500 underline underline-offset-1">
                  Băng keo
                </p>
                <h6 className="text-base font-semibold">
                  {childNodes[index]!.name}
                </h6>
                <div className="self-start text-sm max-md:max-w-full">
                  Siêu thị công nghiệp Wecare chuyên cung cấp sản phẩm đa dạng
                  mẫu mã, phục vụ đa ngành nghề. Giá cả cạnh tranh, đảm bảo trải
                  nghiệm khách hàng tốt nhất.
                </div>
                <div className="pt-2 text-base text-red-500">
                  {formatter.format(priceMin)} - {formatter.format(priceMax)}
                </div>
              </div>
            </div>
            <div className="mb-1 h-[1px] w-full border border-b border-dashed"></div>
            {Object.entries(groupedByChatLieu).map(([key, value]) => {
              return <PriceTable material={key} key={index} data={value} />;
            })}
          </div>
        );
      })}
    </div>
  );
};
