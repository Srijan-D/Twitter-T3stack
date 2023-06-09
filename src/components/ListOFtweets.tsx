import Link from "next/link"
import InfiniteScroll from "react-infinite-scroll-component"
import ProfilePicture from "./ProfilePicture"
import { useSession } from 'next-auth/react'
import { VscHeart, VscHeartFilled } from 'react-icons/vsc'
import { IconHoverEffect } from "./IconHoverEffect"
import { api } from "~/utils/api"
import Loading from "./Loading"


type Tweet = {
    id: string
    content: string
    createdAt: Date
    likeCount: number
    likedByMe: boolean;
    user: {
        id: string
        name: string | null
        image: string | null
    }
}


type InfiniteTweetListProps = {
    isLoading: boolean
    isError: boolean
    hasMore: boolean | undefined
    fetchNextPage: () => Promise<unknown>
    tweets?: Tweet[]
}

type HeartButton = {
    isLoading: boolean
    onClick: () => void
    likedByMe: boolean
    likeCount: number
}



export default function ListOFtweets({ tweets, isError, isLoading, fetchNextPage, hasMore = false }: InfiniteTweetListProps) {

    if (isLoading) return <Loading />
    if (isError) return <p>Error...</p>
    if (tweets == null) return null
    if (tweets.length === 0) return <h2 className="my-4 text-center text-2xl text-gray-500">No tweets</h2>


    return (<ul>
        <InfiniteScroll
            dataLength={tweets.length}
            next={fetchNextPage}
            hasMore={hasMore}
            loader={<Loading />}
        >
            {tweets.map((tweet) => {
                return <TweetCard key={tweet.id} {...tweet} />
            })}
        </InfiniteScroll>
    </ul>
    )
}


function TweetCard({ id, user, content, createdAt, likeCount, likedByMe }: Tweet) {

    const trpcUtils = api.useContext()
    const toggleLike = api.tweet.toggleLike.useMutation({
        onSuccess: ({ addedLike }) => {
            const updateData: Parameters<typeof trpcUtils.tweet.infiniteScroll.setInfiniteData>[1] = (oldData) => {
                if (oldData == null) return

                const count = addedLike ? 1 : -1
                return {
                    ...oldData,
                    pages: oldData.pages.map((page) => {
                        return {
                            ...page,
                            tweets: page.tweets.map((tweet) => {
                                if (tweet.id === id) {
                                    return {
                                        ...tweet,
                                        likeCount: tweet.likeCount + count,
                                        likedByMe: addedLike,
                                    }
                                }
                                return tweet
                            })
                        }
                    })
                }

            }

            trpcUtils.tweet.infiniteScroll.setInfiniteData({}, updateData)
            trpcUtils.tweet.infiniteScroll.setInfiniteData({ onlyFollowing: true }, updateData)
            trpcUtils.tweet.infiniteProfileTweets.setInfiniteData({ userId: user.id }, updateData)
        },
    })
    const handleLike = () => {
        toggleLike.mutate({ id })
    }


    return <li className="flex gap-4 border-b px-4 py-4 ">
        <Link href={`/profiles/${user.id}`}>
            <ProfilePicture src={user.image} />
        </Link>
        <div className="flex flex-grow flex-col">
            <div className="flex gap-1 ">
                <Link href={`/profiles/${user.id}`} className="font-bold outline-none hover:underline focus-visible:underline">
                    {user.name}
                </Link>
                <span className="text-gray-500">-</span>
                <span className="text-gray-500">{dateTimeFormatter.format(createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap">{content}</p>
            <HeartButton onClick={handleLike} isLoading={toggleLike.isLoading} likedByMe={likedByMe} likeCount={likeCount} />

        </div>
    </li>
}
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "short" })

function HeartButton({ isLoading, onClick, likedByMe, likeCount }: HeartButton) {
    const session = useSession()
    const HeartIcon = likedByMe ? VscHeartFilled : VscHeart

    if (session.status !== 'authenticated') {
        return (<div className="mb-1 mt-1 flex items-center gap-3 self-start text-gray-500">
            <HeartIcon />
            <span>{likeCount}</span>
        </div>)
    }
    return (
        <button
            disabled={isLoading}
            onClick={onClick}
            className={`group -ml-2 flex items-center gap-1 self-start transition-colors duration-200 ${likedByMe
                ? "text-red-500"
                : "text-gray-500 hover:text-red-500 focus-visible:text-red-500"
                }`}
        >
            <IconHoverEffect red>
                <HeartIcon
                    className={`transition-colors duration-200 ${likedByMe
                        ? "fill-red-500 "
                        : "fill-gray-500 group-hover:fill-red-500 group-focus-visible:fill-red-500"
                        }`}
                />
            </IconHoverEffect>
            <span>{likeCount}</span>
        </button>
    )

}
